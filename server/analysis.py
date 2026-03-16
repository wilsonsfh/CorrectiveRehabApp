"""MediaPipe pose estimation and symmetry scoring for gym form analysis."""

import logging
import math
import subprocess
import tempfile
from pathlib import Path

import cv2
import httpx
import mediapipe as mp
import numpy as np

logger = logging.getLogger(__name__)

mp_pose = mp.solutions.pose

# MediaPipe landmark indices
LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12
LEFT_HIP = 23
RIGHT_HIP = 24
LEFT_KNEE = 25
RIGHT_KNEE = 26
LEFT_ANKLE = 27
RIGHT_ANKLE = 28
LEFT_WRIST = 15
RIGHT_WRIST = 16
NOSE = 0

# Severity deductions
SEVERITY_DEDUCTIONS = {"mild": 5, "moderate": 12, "severe": 20}

# Thresholds per angle → issue
SIDE_THRESHOLDS = {
    "forward_lean": {"mild": 20, "moderate": 30, "severe": 40},  # degrees
    "butt_wink": {"mild": 10, "moderate": 18, "severe": 25},  # degrees of pelvic tilt
}

FRONT_THRESHOLDS = {
    "hip_shift": {"mild": 0.03, "moderate": 0.06, "severe": 0.10},  # ratio of hip width
    "hip_hike": {"mild": 0.02, "moderate": 0.05, "severe": 0.08},  # ratio of torso height
    "ankle_cave": {"mild": 8, "moderate": 15, "severe": 22},  # degrees valgus
    "shoulder_shrug": {"mild": 0.02, "moderate": 0.04, "severe": 0.07},  # ratio
}

ABOVE_THRESHOLDS = {
    "bar_rotation": {"mild": 5, "moderate": 10, "severe": 18},  # degrees
    "wrist_symmetry": {"mild": 0.04, "moderate": 0.08, "severe": 0.15},  # ratio
}

ISSUE_LABELS = {
    "hip_shift": "Left-Side Shift",
    "ankle_cave": "Ankle Cave",
    "hip_hike": "Hip Hike",
    "shoulder_shrug": "Shoulder Shrug",
    "forward_lean": "Forward Lean",
    "butt_wink": "Butt Wink",
    "bar_rotation": "Bar Rotation",
    "wrist_symmetry": "Wrist Asymmetry",
}


def _angle_between(a, b, c):
    """Compute angle at point b given three 2D/3D points."""
    ba = np.array(a) - np.array(b)
    bc = np.array(c) - np.array(b)
    cos_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-8)
    return math.degrees(math.acos(np.clip(cos_angle, -1, 1)))


def _midpoint(a, b):
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]


def _landmark_xy(landmark):
    return [landmark.x, landmark.y]


def _landmark_xyz(landmark):
    return [landmark.x, landmark.y, landmark.z]


def _classify_severity(value, thresholds):
    """Classify value as mild/moderate/severe given ascending thresholds."""
    if value >= thresholds["severe"]:
        return "severe"
    if value >= thresholds["moderate"]:
        return "moderate"
    if value >= thresholds["mild"]:
        return "mild"
    return None


def _analyze_side(landmarks_list):
    """Side-view analysis: forward lean, butt wink."""
    issues = []
    lean_angles = []
    wink_angles = []

    for lm in landmarks_list:
        # Forward lean: angle between vertical and shoulder-hip line
        shoulder_mid = _midpoint(_landmark_xy(lm[LEFT_SHOULDER]), _landmark_xy(lm[RIGHT_SHOULDER]))
        hip_mid = _midpoint(_landmark_xy(lm[LEFT_HIP]), _landmark_xy(lm[RIGHT_HIP]))
        # Vertical reference point directly above hip
        vertical_ref = [hip_mid[0], hip_mid[1] - 0.3]
        lean = abs(180 - _angle_between(vertical_ref, hip_mid, shoulder_mid))
        lean_angles.append(lean)

        # Butt wink: angle at hip (shoulder-hip-knee) deviation from 180
        knee_mid = _midpoint(_landmark_xy(lm[LEFT_KNEE]), _landmark_xy(lm[RIGHT_KNEE]))
        hip_angle = _angle_between(shoulder_mid, hip_mid, knee_mid)
        wink = abs(180 - hip_angle)
        wink_angles.append(wink)

    # Use the worst frame (max deviation)
    max_lean = max(lean_angles) if lean_angles else 0
    severity = _classify_severity(max_lean, SIDE_THRESHOLDS["forward_lean"])
    if severity:
        issues.append({
            "id": "forward_lean",
            "label": ISSUE_LABELS["forward_lean"],
            "severity": severity,
            "detail": f"Torso tilted {max_lean:.1f}° forward from vertical at deepest point",
            "measurement": round(max_lean, 1),
        })

    max_wink = max(wink_angles) if wink_angles else 0
    severity = _classify_severity(max_wink, SIDE_THRESHOLDS["butt_wink"])
    if severity:
        issues.append({
            "id": "butt_wink",
            "label": ISSUE_LABELS["butt_wink"],
            "severity": severity,
            "detail": f"Posterior pelvic tilt of {max_wink:.1f}° detected at depth",
            "measurement": round(max_wink, 1),
        })

    return issues


def _analyze_front(landmarks_list):
    """Front-view analysis: hip shift, hip hike, knee valgus, shoulder shrug."""
    issues = []
    shifts = []
    hikes = []
    valgus_values = []
    shrugs = []

    for lm in landmarks_list:
        l_hip = _landmark_xy(lm[LEFT_HIP])
        r_hip = _landmark_xy(lm[RIGHT_HIP])
        l_shoulder = _landmark_xy(lm[LEFT_SHOULDER])
        r_shoulder = _landmark_xy(lm[RIGHT_SHOULDER])
        l_knee = _landmark_xy(lm[LEFT_KNEE])
        r_knee = _landmark_xy(lm[RIGHT_KNEE])
        l_ankle = _landmark_xy(lm[LEFT_ANKLE])
        r_ankle = _landmark_xy(lm[RIGHT_ANKLE])

        hip_mid = _midpoint(l_hip, r_hip)
        shoulder_mid = _midpoint(l_shoulder, r_shoulder)
        hip_width = abs(l_hip[0] - r_hip[0])

        # Hip shift: lateral displacement of hip midpoint from shoulder midpoint
        shift = abs(hip_mid[0] - shoulder_mid[0])
        shift_ratio = shift / (hip_width + 1e-8)
        shifts.append(shift_ratio)

        # Hip hike: vertical difference between hips
        torso_height = abs(shoulder_mid[1] - hip_mid[1])
        hike = abs(l_hip[1] - r_hip[1])
        hike_ratio = hike / (torso_height + 1e-8)
        hikes.append(hike_ratio)

        # Knee valgus (ankle cave): angle deviation of knee from hip-ankle line
        # Check both sides, take the worse one
        for knee, hip, ankle in [(l_knee, l_hip, l_ankle), (r_knee, r_hip, r_ankle)]:
            angle = _angle_between(hip, knee, ankle)
            valgus = abs(180 - angle)
            valgus_values.append(valgus)

        # Shoulder shrug: vertical difference between shoulders relative to torso
        shrug = abs(l_shoulder[1] - r_shoulder[1])
        shrug_ratio = shrug / (torso_height + 1e-8)
        shrugs.append(shrug_ratio)

    max_shift = max(shifts) if shifts else 0
    severity = _classify_severity(max_shift, FRONT_THRESHOLDS["hip_shift"])
    if severity:
        issues.append({
            "id": "hip_shift",
            "label": ISSUE_LABELS["hip_shift"],
            "severity": severity,
            "detail": f"Hip center shifted {max_shift * 100:.1f}% of hip width laterally",
            "measurement": round(max_shift, 3),
        })

    max_hike = max(hikes) if hikes else 0
    severity = _classify_severity(max_hike, FRONT_THRESHOLDS["hip_hike"])
    if severity:
        issues.append({
            "id": "hip_hike",
            "label": ISSUE_LABELS["hip_hike"],
            "severity": severity,
            "detail": f"Hip drop of {max_hike * 100:.1f}% of torso height detected",
            "measurement": round(max_hike, 3),
        })

    max_valgus = max(valgus_values) if valgus_values else 0
    severity = _classify_severity(max_valgus, FRONT_THRESHOLDS["ankle_cave"])
    if severity:
        issues.append({
            "id": "ankle_cave",
            "label": ISSUE_LABELS["ankle_cave"],
            "severity": severity,
            "detail": f"Knee valgus angle of {max_valgus:.1f}° detected",
            "measurement": round(max_valgus, 1),
        })

    max_shrug = max(shrugs) if shrugs else 0
    severity = _classify_severity(max_shrug, FRONT_THRESHOLDS["shoulder_shrug"])
    if severity:
        issues.append({
            "id": "shoulder_shrug",
            "label": ISSUE_LABELS["shoulder_shrug"],
            "severity": severity,
            "detail": f"Shoulder height difference of {max_shrug * 100:.1f}% of torso height",
            "measurement": round(max_shrug, 3),
        })

    return issues


def _analyze_above(landmarks_list):
    """Above-view analysis: bar rotation, wrist symmetry. Relaxed thresholds."""
    issues = []
    rotations = []
    wrist_asym = []

    for lm in landmarks_list:
        l_wrist = _landmark_xy(lm[LEFT_WRIST])
        r_wrist = _landmark_xy(lm[RIGHT_WRIST])
        l_shoulder = _landmark_xy(lm[LEFT_SHOULDER])
        r_shoulder = _landmark_xy(lm[RIGHT_SHOULDER])

        # Bar rotation: angle between wrist line and shoulder line
        wrist_dx = r_wrist[0] - l_wrist[0]
        wrist_dy = r_wrist[1] - l_wrist[1]
        shoulder_dx = r_shoulder[0] - l_shoulder[0]
        shoulder_dy = r_shoulder[1] - l_shoulder[1]

        wrist_angle = math.atan2(wrist_dy, wrist_dx)
        shoulder_angle = math.atan2(shoulder_dy, shoulder_dx)
        rotation = abs(math.degrees(wrist_angle - shoulder_angle))
        if rotation > 90:
            rotation = 180 - rotation
        rotations.append(rotation)

        # Wrist symmetry: relative distance difference from shoulders to wrists
        l_dist = math.hypot(l_wrist[0] - l_shoulder[0], l_wrist[1] - l_shoulder[1])
        r_dist = math.hypot(r_wrist[0] - r_shoulder[0], r_wrist[1] - r_shoulder[1])
        avg_dist = (l_dist + r_dist) / 2 + 1e-8
        asym = abs(l_dist - r_dist) / avg_dist
        wrist_asym.append(asym)

    max_rotation = max(rotations) if rotations else 0
    severity = _classify_severity(max_rotation, ABOVE_THRESHOLDS["bar_rotation"])
    if severity:
        issues.append({
            "id": "bar_rotation",
            "label": ISSUE_LABELS["bar_rotation"],
            "severity": severity,
            "detail": f"Bar rotated {max_rotation:.1f}° relative to shoulder line",
            "measurement": round(max_rotation, 1),
        })

    max_asym = max(wrist_asym) if wrist_asym else 0
    severity = _classify_severity(max_asym, ABOVE_THRESHOLDS["wrist_symmetry"])
    if severity:
        issues.append({
            "id": "wrist_symmetry",
            "label": ISSUE_LABELS["wrist_symmetry"],
            "severity": severity,
            "detail": f"Wrist distance asymmetry of {max_asym * 100:.1f}%",
            "measurement": round(max_asym, 3),
        })

    return issues


ANGLE_ANALYZERS = {
    "side": _analyze_side,
    "front": _analyze_front,
    "above": _analyze_above,
}


def _extract_keyframes(video_path: str, max_frames: int = 15):
    """Extract evenly-spaced frames from a video file. Returns (frames, timestamps_ms)."""
    cap = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    if total_frames <= 0:
        cap.release()
        raise ValueError("Could not read video frames")

    step = max(1, total_frames // max_frames)
    frames = []
    timestamps_ms = []
    for i in range(0, total_frames, step):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ret, frame = cap.read()
        if ret:
            frames.append(frame)
            timestamps_ms.append(round(i / fps * 1000))
        if len(frames) >= max_frames:
            break
    cap.release()
    return frames, timestamps_ms


def _run_pose_estimation(frames):
    """Run MediaPipe Pose on a list of frames, return (landmark sets, valid frame indices)."""
    landmarks_list = []
    valid_indices = []
    with mp_pose.Pose(
        static_image_mode=True,
        model_complexity=2,
        min_detection_confidence=0.5,
    ) as pose:
        for i, frame in enumerate(frames):
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(rgb)
            if results.pose_landmarks:
                landmarks_list.append(results.pose_landmarks.landmark)
                valid_indices.append(i)
    return landmarks_list, valid_indices


def _serialize_landmarks(landmarks_list, valid_indices, timestamps_ms):
    """Convert MediaPipe landmarks to JSON-serializable keypoints array."""
    keypoints = []
    for landmarks, idx in zip(landmarks_list, valid_indices):
        frame_landmarks = []
        for lm in landmarks:
            frame_landmarks.append({
                "x": round(lm.x, 4),
                "y": round(lm.y, 4),
                "z": round(lm.z, 4),
                "visibility": round(lm.visibility, 3),
            })
        keypoints.append({
            "frame_index": idx,
            "timestamp_ms": timestamps_ms[idx] if idx < len(timestamps_ms) else 0,
            "landmarks": frame_landmarks,
        })
    return keypoints


def _compute_score(issues):
    """Start at 100, deduct per issue based on severity."""
    score = 100
    for issue in issues:
        score -= SEVERITY_DEDUCTIONS.get(issue["severity"], 0)
    return max(0, min(100, score))


async def _download_video(supabase_url: str, supabase_key: str, storage_path: str) -> str:
    """Download video from Supabase Storage to a temp file, return path."""
    url = f"{supabase_url}/storage/v1/object/session-videos/{storage_path}"
    headers = {
        "Authorization": f"Bearer {supabase_key}",
        "apikey": supabase_key,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.get(url, headers=headers)
        logger.info("Download %s status=%d size=%d", storage_path, resp.status_code, len(resp.content))
        resp.raise_for_status()

    suffix = Path(storage_path).suffix or ".mp4"
    tmp = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
    tmp.write(resp.content)
    tmp.close()
    logger.info("Saved to %s (%d bytes)", tmp.name, Path(tmp.name).stat().st_size)
    return tmp.name


def _remux_video(input_path: str) -> str:
    """Remux video with ffmpeg to ensure moov atom is readable by OpenCV."""
    output_path = input_path + "_remuxed.mp4"
    result = subprocess.run(
        ["ffmpeg", "-y", "-i", input_path, "-c", "copy", "-movflags", "faststart", output_path],
        capture_output=True,
    )
    logger.info("ffmpeg returncode=%d stderr=%s", result.returncode, result.stderr[-500:].decode(errors="replace"))
    if result.returncode != 0 or not Path(output_path).exists():
        logger.warning("ffmpeg failed, falling back to original file")
        return input_path
    logger.info("ffmpeg remux ok → %s (%d bytes)", output_path, Path(output_path).stat().st_size)
    return output_path


async def analyze_video_from_storage(
    supabase_url: str,
    supabase_key: str,
    storage_path: str,
    category_id: str,
    angle: str,
) -> dict:
    """Full pipeline: download → remux → extract frames → pose estimation → score."""
    video_path = await _download_video(supabase_url, supabase_key, storage_path)
    remuxed_path = _remux_video(video_path)

    try:
        frames, timestamps_ms = _extract_keyframes(remuxed_path)
        landmarks_list, valid_indices = _run_pose_estimation(frames)

        if not landmarks_list:
            return {"symmetry_score": 100, "issues": [], "keypoints": []}

        analyzer = ANGLE_ANALYZERS.get(angle, _analyze_side)
        issues = analyzer(landmarks_list)
        score = _compute_score(issues)
        keypoints = _serialize_landmarks(landmarks_list, valid_indices, timestamps_ms)

        return {"symmetry_score": score, "issues": issues, "keypoints": keypoints}
    finally:
        Path(video_path).unlink(missing_ok=True)
        if remuxed_path != video_path:
            Path(remuxed_path).unlink(missing_ok=True)
