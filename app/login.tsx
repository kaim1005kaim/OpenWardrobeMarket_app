import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type PageMode = 'login' | 'signup';
type AuthMode = 'password' | 'magic-link';

export default function LoginScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [pageMode, setPageMode] = useState<PageMode>('login');
  const [authMode, setAuthMode] = useState<AuthMode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Redirect to tabs if user is already logged in
  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)');
    }
  }, [user, loading, router]);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      Alert.alert('ログイン成功', 'ようこそ！', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('ログインエラー', error.message || 'ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('エラー', 'パスワードが一致しません');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'openwrdrb://auth/callback',
        },
      });

      if (error) throw error;

      Alert.alert(
        '確認メール送信',
        'メールアドレスに確認リンクを送信しました。メールを確認してアカウントを有効化してください。'
      );
      setPageMode('login');
    } catch (error: any) {
      console.error('Signup error:', error);
      Alert.alert('サインアップエラー', error.message || 'サインアップに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      Alert.alert('エラー', 'メールアドレスを入力してください');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: 'openwrdrb://auth/callback',
        },
      });

      if (error) throw error;

      setMagicLinkSent(true);
      Alert.alert('マジックリンク送信', 'メールアドレスにログインリンクを送信しました');
    } catch (error: any) {
      console.error('Magic link error:', error);
      Alert.alert('エラー', error.message || 'メール送信に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // Use OAuth flow for Google Sign-In (works in both Expo Go and Development Build)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'owm://',
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Google login error:', error);
      Alert.alert('Googleログインエラー', error.message || 'ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (pageMode === 'login') {
      if (authMode === 'password') {
        handleEmailLogin();
      } else {
        handleMagicLink();
      }
    } else {
      if (authMode === 'password') {
        handleSignup();
      } else {
        handleMagicLink();
      }
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ImageBackground
        source={require('@/assets/images/mobile_TOP_BG.png')}
        style={styles.container}
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Brand Title */}
            <View style={styles.brandTitle}>
              <Text style={styles.brandTitleText}>OPEN</Text>
              <Text style={styles.brandTitleText}>WARDROBE</Text>
              <Text style={styles.brandTitleText}>MARKET</Text>
            </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Password Input (if password mode) */}
            {authMode === 'password' && (
              <>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>

                {/* Confirm Password (if signup) */}
                {pageMode === 'signup' && (
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm Password"
                      placeholderTextColor="#999"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                  </View>
                )}
              </>
            )}

            {/* Auth Mode Toggle (signup only) */}
            {pageMode === 'signup' && (
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    authMode === 'password' && styles.toggleButtonActive,
                  ]}
                  onPress={() => setAuthMode('password')}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      authMode === 'password' && styles.toggleTextActive,
                    ]}
                  >
                    Password
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    authMode === 'magic-link' && styles.toggleButtonActive,
                  ]}
                  onPress={() => setAuthMode('magic-link')}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      authMode === 'magic-link' && styles.toggleTextActive,
                    ]}
                  >
                    Magic Link
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FAFAF7" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {pageMode === 'login'
                    ? authMode === 'password'
                      ? 'LOGIN'
                      : 'SEND MAGIC LINK'
                    : authMode === 'password'
                    ? 'SIGN UP'
                    : 'SEND MAGIC LINK'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Google Login & Mode Toggle */}
            {pageMode === 'login' && (
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleLogin}
                disabled={isLoading}
              >
                <Text style={styles.googleButtonText}>GOOGLE LOGIN</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.modeToggleButton}
              onPress={() => {
                setPageMode(pageMode === 'login' ? 'signup' : 'login');
                setAuthMode('password');
                setPassword('');
                setConfirmPassword('');
              }}
              disabled={isLoading}
            >
              <Text style={styles.modeToggleText}>
                {pageMode === 'login' ? 'NEW ACCOUNT' : 'BACK TO LOGIN'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 40,
    paddingTop: 0,
    paddingBottom: 60,
    justifyContent: 'space-between',
  },
  brandTitle: {
    width: '100%',
    alignItems: 'flex-start',
    marginTop: 200,
    marginBottom: 64,
    paddingLeft: '10%',
  },
  brandTitleText: {
    fontFamily: 'Trajan',
    fontWeight: '400',
    fontSize: 22,
    lineHeight: 44,
    letterSpacing: 1.76,
    color: '#FAFAF7',
    textAlign: 'left',
  },
  form: {
    width: '100%',
    alignItems: 'center',
  },
  inputContainer: {
    width: '80%',
    maxWidth: 320,
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.6)',
    paddingVertical: 6,
    paddingHorizontal: 0,
    fontSize: 14,
    letterSpacing: 0.7,
    color: '#FAFAF7',
    fontFamily: 'System',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#9CA3AF',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  toggleButtonActive: {
    backgroundColor: '#FAFAF7',
  },
  toggleText: {
    fontSize: 14,
    color: '#FAFAF7',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#1a3d3d',
  },
  submitButton: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FAFAF7',
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FAFAF7',
    fontSize: 12,
    fontFamily: 'System',
    letterSpacing: 2.4,
    fontWeight: '400',
  },
  googleButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.6)',
    paddingVertical: 1,
    paddingHorizontal: 0,
    marginTop: 32,
    marginBottom: 16,
  },
  googleButtonText: {
    color: '#FAFAF7',
    fontSize: 9,
    fontFamily: 'System',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  modeToggleButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.6)',
    paddingVertical: 1,
    paddingHorizontal: 0,
  },
  modeToggleText: {
    color: '#FAFAF7',
    fontSize: 9,
    fontFamily: 'System',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
});
