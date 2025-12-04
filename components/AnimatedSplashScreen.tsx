import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useSplashReady } from '@/contexts/SplashContext';

const { width, height } = Dimensions.get('window');

interface AnimatedSplashScreenProps {
  dataReady?: boolean;
}

export function AnimatedSplashScreen({ dataReady = false }: AnimatedSplashScreenProps) {
  const videoRef = useRef<Video>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const { isAppReady } = useSplashReady();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // Auto-play video when component mounts
    if (videoRef.current) {
      videoRef.current.playAsync();
    }
  }, []);

  useEffect(() => {
    // Start fade-out when all conditions are met:
    // 1. Video has ended
    // 2. Data preload is complete
    // 3. App (STUDIO screen) signals it's ready
    const allReady = videoEnded && dataReady && isAppReady;

    if (allReady) {
      console.log('[AnimatedSplash] All conditions met, starting fade-out');

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Unmount the splash screen after fade completes
        console.log('[AnimatedSplash] Fade complete, unmounting');
        setShouldRender(false);
      });
    }
  }, [videoEnded, dataReady, isAppReady, fadeAnim]);

  const handlePlaybackStatusUpdate = (status: any) => {
    if (status.didJustFinish && !videoEnded) {
      console.log('[AnimatedSplash] Video finished, waiting for app ready...');
      setVideoEnded(true);
    }
  };

  if (!shouldRender) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Video
        ref={videoRef}
        source={require('../assets/videos/splash.mp4')}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping={false}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        isMuted
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 9999,
  },
  video: {
    width: width,
    height: height,
  },
});
