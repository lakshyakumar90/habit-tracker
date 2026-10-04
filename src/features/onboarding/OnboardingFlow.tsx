import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, { FadeIn, FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { BackgroundBlobs } from '../../components/decorative/BackgroundBlobs';
import { useHabitly } from '../app/AppProvider';
import { useOnboardingTheme } from './theme';
import { appRoute } from '../../utils/routes';
import { ageRanges, discoveryOptions, interestOptions } from './types';
import { AccountActionButton, FormHeading, FriendlyFace, HabitlyMark, PrimaryActionButton, ProgressHeader } from './OnboardingChrome';

const stepCount = 5;

export function OnboardingFlow() {
  const { profileName, onboardingDraft, setPreference } = useHabitly();
  const theme = useOnboardingTheme();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profileName === 'Friend' ? '' : profileName);
  const [ageRange, setAgeRange] = useState(onboardingDraft.ageRange);
  const [interests, setInterests] = useState<string[]>(onboardingDraft.interests);
  const [discoverySource, setDiscoverySource] = useState(onboardingDraft.discoverySource);
  const [motivation, setMotivation] = useState(onboardingDraft.motivation);
  const [error, setError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const back = () => {
    setError('');
    setAuthNotice('');
    if (step > 0 && step < stepCount) setStep(current => current - 1);
    else if (step === stepCount) setStep(stepCount - 1);
    else if (router.canGoBack()) router.back();
    else router.replace(appRoute('/welcome'));
  };

  const next = async () => {
    if (savingRef.current) return;
    setError('');
    savingRef.current = true;
    setSaving(true);
    try {
      if (step === 0) {
        if (!name.trim()) { setError('Add your name to continue.'); return; }
        await setPreference('profileName', name.trim());
      } else if (step === 1) {
        if (!ageRange) { setError('Choose an age range to continue.'); return; }
        await setPreference('onboardingAgeRange', ageRange);
      } else if (step === 2) {
        await setPreference('onboardingInterests', JSON.stringify(interests));
      } else if (step === 3) {
        if (!discoverySource) { setError('Choose one option to continue.'); return; }
        await setPreference('onboardingDiscovery', discoverySource);
      } else if (step === 4) {
        await setPreference('onboardingMotivation', motivation.trim());
      }
      setStep(current => Math.min(stepCount, current + 1));
    } catch {
      setError('We could not save that just now. Please try again.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const skipMotivation = async () => {
    if (savingRef.current) return;
    setError('');
    savingRef.current = true;
    setSaving(true);
    try {
      await setPreference('onboardingMotivation', '');
      setMotivation('');
      setStep(stepCount);
    } catch {
      setError('We could not save that just now. Please try again.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const continueAsGuest = async () => {
    if (savingRef.current) return;
    setAuthNotice('');
    savingRef.current = true;
    setSaving(true);
    try {
      await setPreference('onboardingComplete', 'true');
      router.replace(appRoute('/(tabs)/today'));
    } catch {
      setAuthNotice('Your profile could not be saved. Please try again.');
      savingRef.current = false;
      setSaving(false);
    }
  };

  return <View style={{ flex: 1, overflow: 'hidden', backgroundColor: theme.canvas }}>
    <BackgroundBlobs variant={step === stepCount ? 'celebration' : 'onboarding'} />
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 6, paddingBottom: 12 }}>
          {step < stepCount
            ? <ProgressHeader step={step + 1} onBack={back} />
            : <View style={{ height: 42, justifyContent: 'center' }}><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={back} style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface }}><MaterialCommunityIcons name="chevron-left" size={26} color={theme.ink} /></Pressable></View>}

          {step < stepCount ? <>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingTop: 28, paddingBottom: 12 }}>
              <Animated.View key={step} entering={FadeInRight.duration(230)} exiting={FadeOutLeft.duration(150)} style={{ flexGrow: 1, gap: 20 }}>
                {step === 0 && <NameStep name={name} onChange={value => { setName(value); if (error) setError(''); }} />}
                {step === 1 && <AgeStep value={ageRange} onSelect={value => { setAgeRange(value); if (error) setError(''); }} />}
                {step === 2 && <InterestStep values={interests} onToggle={id => { setInterests(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]); if (error) setError(''); }} />}
                {step === 3 && <DiscoveryStep value={discoverySource} onSelect={value => { setDiscoverySource(value); if (error) setError(''); }} />}
                {step === 4 && <MotivationStep value={motivation} onChange={setMotivation} />}
                {!!error && <Text accessibilityRole="alert" style={{ color: theme.danger, fontSize: 13, lineHeight: 18 }}>{error}</Text>}
              </Animated.View>
            </ScrollView>
            {step === 4 && <Pressable accessibilityRole="button" disabled={saving} onPress={() => void skipMotivation()} style={{ minHeight: 46, borderRadius: 23, backgroundColor: theme.purpleSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 10, opacity: saving ? 0.7 : 1 }}><Text style={{ color: theme.ink, fontSize: 14, fontWeight: '600' }}>Skip for now</Text></Pressable>}
            <PrimaryActionButton label={saving ? 'Saving…' : 'Continue'} onPress={() => void next()} disabled={saving} />
          </> : <ReadyStep name={name.trim() || profileName} notice={authNotice} onUnavailableAuth={setAuthNotice} onGuest={() => void continueAsGuest()} />}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </View>;
}

function NameStep({ name, onChange }: { name: string; onChange: (value: string) => void }) {
  const theme = useOnboardingTheme();
  return <>
    <FormHeading title="What should we call you?" description="This helps us personalize your experience." />
    <View style={{ minHeight: 58, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, backgroundColor: theme.purpleSoft }}>
      <MaterialCommunityIcons name="account-outline" size={21} color={theme.ink} />
      <TextInput accessibilityLabel="Your name" value={name} onChangeText={onChange} placeholder="Enter your name" placeholderTextColor={theme.muted} autoCapitalize="words" autoCorrect={false} maxLength={50} returnKeyType="done" style={{ flex: 1, minHeight: 54, color: theme.ink, fontSize: 15 }} />
    </View>
    <View style={{ flex: 1, minHeight: 54, alignItems: 'center', justifyContent: 'center', paddingTop: 10 }}><FriendlyFace /></View>
  </>;
}

function AgeStep({ value, onSelect }: { value: string; onSelect: (value: string) => void }) {
  useHabitly();
  return <>
    <FormHeading title="What’s your age range?" description="This helps us show relevant suggestions for you." />
    <View style={{ gap: 8 }}>
      {ageRanges.map((range, index) => <SelectionRow key={range} label={range} icon={index === 1 ? 'school-outline' : index === 3 ? 'briefcase-outline' : 'account-outline'} selected={value === range} onPress={() => onSelect(range)} />)}
    </View>
  </>;
}

function InterestStep({ values, onToggle }: { values: string[]; onToggle: (id: string) => void }) {
  const theme = useOnboardingTheme();
  return <>
    <FormHeading title="What are you most interested in?" description="Choose a few areas you’d like to improve." />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
      {interestOptions.map(option => {
        const selected = values.includes(option.id);
        const tint = option.tint === 'yellow' ? theme.yellowSoft : option.tint === 'purple' ? theme.purpleSoft : theme.surface;
        return <Pressable key={option.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={() => onToggle(option.id)} style={({ pressed }) => ({ width: '31.5%', minHeight: 89, borderRadius: 17, alignItems: 'center', justifyContent: 'center', gap: 7, padding: 7, backgroundColor: selected ? tint : theme.surface, borderColor: selected ? theme.purple : theme.line, borderWidth: selected ? 1.5 : 1, opacity: pressed ? 0.82 : 1 })}>
          <MaterialCommunityIcons name={option.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={23} color={theme.ink} />
          <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: theme.ink, fontSize: 12, fontWeight: '600' }}>{option.label}</Text>
          {selected && <View style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9, backgroundColor: theme.purple, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name="check" size={13} color="#FFFFFF" /></View>}
        </Pressable>;
      })}
    </View>
  </>;
}

function DiscoveryStep({ value, onSelect }: { value: string; onSelect: (value: string) => void }) {
  const theme = useOnboardingTheme();
  return <>
    <FormHeading title="How did you hear about us?" description="This helps us improve and reach more people like you." />
    <View style={{ gap: 6 }}>
      {discoveryOptions.map(option => <Pressable key={option.label} accessibilityRole="radio" accessibilityState={{ selected: value === option.label }} onPress={() => onSelect(option.label)} style={({ pressed }) => ({ minHeight: 44, borderRadius: 15, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: value === option.label ? theme.purpleSoft : theme.surface, borderWidth: 1, borderColor: value === option.label ? theme.purple : theme.line, opacity: pressed ? 0.8 : 1 })}>
        <View style={{ width: 29, height: 29, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surfaceRaised }}><MaterialCommunityIcons name={option.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={17} color={option.color} /></View>
        <Text style={{ flex: 1, color: theme.ink, fontSize: 13, fontWeight: '500' }}>{option.label}</Text>
        <SelectionIndicator selected={value === option.label} />
      </Pressable>)}
    </View>
  </>;
}

function MotivationStep({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const theme = useOnboardingTheme();
  return <>
    <FormHeading title="Why do you want to build better habits?" description="This helps us personalize your experience further." />
    <TextInput accessibilityLabel="Your motivation (optional)" value={value} onChangeText={onChange} placeholder="e.g. I want to be healthier, more productive and feel better overall…" placeholderTextColor={theme.subtle} maxLength={300} multiline textAlignVertical="top" style={{ minHeight: 155, borderRadius: 18, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, padding: 15, color: theme.ink, fontSize: 14, lineHeight: 20 }} />
    <View style={{ flex: 1, minHeight: 74, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18 }}><View style={{ marginTop: 19 }}><FriendlyFace /></View><View style={{ width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface }}><MaterialCommunityIcons name="heart" size={25} color={theme.purple} /></View></View>
  </>;
}

function ReadyStep({ name, notice, onUnavailableAuth, onGuest }: { name: string; notice: string; onUnavailableAuth: (notice: string) => void; onGuest: () => void }) {
  const theme = useOnboardingTheme();
  const unavailable = () => onUnavailableAuth('Google and email sign-in will be connected in a later update. Continue as a guest to start using Habitly.');
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingTop: 8, paddingBottom: 12 }}>
    <Animated.View entering={FadeIn.duration(360)}><HabitlyMark size={82} /></Animated.View>
    <View style={{ alignItems: 'center', gap: 8 }}>
      <Text style={{ color: theme.ink, fontSize: 27, lineHeight: 32, letterSpacing: -0.6, textAlign: 'center', fontWeight: '800' }}>You’re ready,{'\n'}{name || 'Friend'}!</Text>
      <Text style={{ maxWidth: 300, color: theme.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' }}>Create an account to save your progress and access it everywhere.</Text>
    </View>
    <View style={{ width: '100%', gap: 10, marginTop: 6 }}>
      <AccountActionButton label="Continue with Google" icon="google" iconColor="#4285F4" onPress={unavailable} />
      <AccountActionButton label="Continue with Email" icon="email-outline" onPress={unavailable} />
      <AccountActionButton label="Continue as Guest" icon="account-outline" onPress={onGuest} />
    </View>
    {!!notice && <Text accessibilityRole="alert" style={{ color: theme.muted, textAlign: 'center', fontSize: 12, lineHeight: 17 }}>{notice}</Text>}
    <Text style={{ maxWidth: 290, color: theme.muted, textAlign: 'center', fontSize: 11, lineHeight: 16, marginTop: 3 }}>By continuing, you agree to our Terms and Privacy Policy.</Text>
  </View>;
}

function SelectionRow({ label, icon, selected, onPress }: { label: string; icon: string; selected: boolean; onPress: () => void }) {
  const theme = useOnboardingTheme();
  return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => ({ minHeight: 51, borderRadius: 16, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: selected ? theme.purpleSoft : theme.surface, borderWidth: 1, borderColor: selected ? theme.purple : theme.line, opacity: pressed ? 0.8 : 1 })}>
    <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: theme.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={19} color={theme.ink} /></View>
    <Text style={{ flex: 1, color: theme.ink, fontSize: 14, fontWeight: '500' }}>{label}</Text>
    <SelectionIndicator selected={selected} />
  </Pressable>;
}

function SelectionIndicator({ selected }: { selected: boolean }) {
  const theme = useOnboardingTheme();
  return <View style={{ width: 21, height: 21, borderRadius: 11, borderWidth: selected ? 0 : 1.5, borderColor: theme.line, backgroundColor: selected ? theme.purple : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{selected && <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />}</View>;
}

