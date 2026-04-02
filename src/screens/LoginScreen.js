import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { Mail, ArrowRight, Zap, Hash } from 'lucide-react-native';

export default function LoginScreen() {
  const { sendOtp, verifyOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'code'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const codeInputRef = useRef(null);

  const handleSendCode = async () => {
    setErrorMsg('');
    if (!email.trim()) {
      setErrorMsg('Enter your email to receive a code.');
      return;
    }
    setLoading(true);
    const { error } = await sendOtp(email.trim());
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setStep('code');
      setTimeout(() => codeInputRef.current?.focus(), 300);
    }
  };

  const handleVerifyCode = async () => {
    setErrorMsg('');
    if (code.length < 6) {
      setErrorMsg('Enter the 6-digit code from your email.');
      return;
    }
    setLoading(true);
    const { error } = await verifyOtp(email.trim(), code.trim());
    setLoading(false);
    if (error) {
      setErrorMsg('Code is incorrect or expired. Try again.');
      setCode('');
    }
    // on success, AuthContext session updates and App.js renders AppNavigator
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inner}
        >
          <View style={styles.heroSection}>
            <View style={styles.iconWrap}>
              <Zap color={COLORS.primary} size={32} />
            </View>
            <Text style={styles.title}>CORRECTIVE{'\n'}REHAB</Text>
            <Text style={styles.subtitle}>
              AI-powered biomechanical auditing for lifters.
            </Text>
          </View>

          {step === 'email' ? (
            <View style={styles.formSection}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={styles.inputRow}>
                <Mail color={COLORS.textTertiary} size={18} />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                  onSubmitEditing={handleSendCode}
                  returnKeyType="send"
                />
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSendCode}
                activeOpacity={0.8}
                disabled={loading}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDim]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitBtnGradient}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.background} />
                  ) : (
                    <>
                      <Text style={styles.submitBtnText}>Send Code</Text>
                      <ArrowRight color={COLORS.background} size={18} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {errorMsg ? <Text style={styles.errorMsg}>{errorMsg}</Text> : null}
              <Text style={styles.disclaimer}>
                We'll send a login code to your email. No password needed.
              </Text>
            </View>
          ) : (
            <View style={styles.formSection}>
              <Text style={styles.codeHint}>
                Code sent to <Text style={styles.codeEmail}>{email}</Text>
              </Text>

              <Text style={styles.label}>LOGIN CODE</Text>
              <View style={styles.inputRow}>
                <Hash color={COLORS.textTertiary} size={18} />
                <TextInput
                  ref={codeInputRef}
                  style={[styles.input, styles.codeInput]}
                  placeholder="12345678"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="number-pad"
                  maxLength={8}
                  // iOS autofill from email/SMS
                  textContentType="oneTimeCode"
                  // Android autofill
                  autoComplete="one-time-code"
                  value={code}
                  onChangeText={setCode}
                  editable={!loading}
                  onSubmitEditing={handleVerifyCode}
                  returnKeyType="done"
                />
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleVerifyCode}
                activeOpacity={0.8}
                disabled={loading}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDim]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitBtnGradient}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.background} />
                  ) : (
                    <>
                      <Text style={styles.submitBtnText}>Verify Code</Text>
                      <ArrowRight color={COLORS.background} size={18} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {errorMsg ? <Text style={styles.errorMsg}>{errorMsg}</Text> : null}
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => { setStep('email'); setCode(''); setErrorMsg(''); }}
                disabled={loading}
              >
                <Text style={styles.backBtnText}>Use a different email</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.l,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.l,
    backgroundColor: COLORS.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.l,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.s,
    lineHeight: 20,
  },
  formSection: {
    gap: SPACING.m,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.m,
    gap: SPACING.s,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.m,
    fontSize: 16,
    color: COLORS.text,
  },
  codeInput: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 8,
  },
  submitBtn: {
    borderRadius: RADIUS.m,
    overflow: 'hidden',
  },
  submitBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: SPACING.s,
  },
  submitBtnText: {
    color: COLORS.background,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  disclaimer: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  errorMsg: {
    fontSize: 13,
    color: COLORS.accent,
    textAlign: 'center',
    fontWeight: '600',
    backgroundColor: COLORS.accentGlow,
    padding: SPACING.m,
    borderRadius: RADIUS.m,
  },
  codeHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  codeEmail: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  backBtn: {
    alignItems: 'center',
  },
  backBtnText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
