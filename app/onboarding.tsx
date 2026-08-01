import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import {
  Sparkles,
  MapPinned,
  Home,
  Camera,
  AlertTriangle,
  CloudOff,
  UserCircle,
  ChevronRight,
  type LucideIcon,
} from "lucide-react-native";
import { useAuthStore } from "@/src/store/authStore";

interface Step {
  Icon: LucideIcon;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    Icon: Sparkles,
    title: "Bem-vindo ao SISVA",
    description:
      "Sistema de Vigilância Ambiental para agentes de campo. Vamos começar sua jornada.",
  },
  {
    Icon: MapPinned,
    title: "Áreas e Quadras",
    description:
      "Organização inteligente do seu território. Cada quadra é uma nova responsabilidade.",
  },
  {
    Icon: Home,
    title: "Imóveis Organizados",
    description:
      "Visualize todos os imóveis atribuídos a você de forma clara. Toque para ver detalhes.",
  },
  {
    Icon: Camera,
    title: "Registro de Visitas",
    description:
      "Documente cada visita com fotos, status e localização automática. Transparência total.",
  },
  {
    Icon: AlertTriangle,
    title: "Ocorrências Georreferenciadas",
    description:
      "Registre focos e denúncias com precisão. Localize, documente e resolva.",
  },
  {
    Icon: CloudOff,
    title: "Trabalho Offline",
    description:
      "Sua missão não para por falta de conexão. Dados sincronizam quando estiver online.",
  },
  {
    Icon: UserCircle,
    title: "Seu Perfil e Histórico",
    description:
      "Acompanhe suas visitas realizadas e sua contribuição para a saúde pública.",
  },
];

const GRADIENT: readonly [string, string] = ["#10b981", "#3b82f6"];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const markOnboardingSeen = useAuthStore((s) => s.markOnboardingSeen);

  const [currentIndex, setCurrentIndex] = useState(0);
  const isLastStep = currentIndex === STEPS.length - 1;
  const step = STEPS[currentIndex];

  const finishOnboarding = () => {
    // Defensivo: se markOnboardingSeen não existir ainda no store, não quebra
    if (typeof markOnboardingSeen === "function") {
      markOnboardingSeen();
    }
    router.replace("/(auth)");
  };

  const handleNext = () => {
    if (isLastStep) {
      finishOnboarding();
      return;
    }
    setCurrentIndex((i) => i + 1);
  };

  const handleSkip = () => {
    finishOnboarding();
  };

  const handleDotPress = (index: number) => {
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  return (
    <View style={styles.root}>
      {/* Header com Skip */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={handleSkip} style={styles.skipButton} hitSlop={12}>
          <Text style={styles.skipText}>Pular</Text>
        </Pressable>
      </View>

      {/* Hero com ícone */}
      <Animated.View
        key={`hero-${currentIndex}`}
        entering={FadeIn.duration(400)}
        exiting={FadeOut.duration(200)}
        style={styles.heroContainer}
      >
        <LinearGradient
          colors={GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.iconWrapper}>
            <step.Icon color="#FFFFFF" size={72} strokeWidth={1.5} />
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Conteúdo textual */}
      <View style={styles.content}>
        <Animated.View
          key={`text-${currentIndex}`}
          entering={FadeIn.duration(400).delay(150)}
        >
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {String(currentIndex + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
            </Text>
          </View>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.description}>{step.description}</Text>
        </Animated.View>
      </View>

      {/* Footer: dots + botão */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.dotsContainer}>
          {STEPS.map((_, index) => (
            <Pressable
              key={`dot-${index}`}
              onPress={() => handleDotPress(index)}
              hitSlop={8}
              style={[styles.dot, index === currentIndex && styles.dotActive]}
            />
          ))}
        </View>

        <Pressable onPress={handleNext} style={styles.buttonContainer}>
          <LinearGradient
            colors={GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              {isLastStep ? "Começar" : "Próximo"}
            </Text>
            <ChevronRight color="#FFFFFF" size={20} strokeWidth={2.5} />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0A0A0F",
  },
  header: {
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  skipText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "500",
  },
  heroContainer: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  hero: {
    height: 240,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 40,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  badge: {
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 24,
  },
  badgeText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.5,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  description: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 24,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dotActive: {
    width: 24,
    backgroundColor: "#10b981",
  },
  buttonContainer: {
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  button: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});