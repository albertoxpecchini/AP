import { BrainCircuit } from "lucide-react";
import GameGate from "../_game/ui/GameGate";
import { storeNick } from "./nickname";
import { ACCENTS } from "../_game/ui/tokens";

export { getStoredNick, storeNick } from "./nickname";

interface NicknameGateProps {
  dark: boolean;
  initial?: string;
  onConfirm: (nick: string) => void;
}

/**
 * Schermata "gate" di Trivia: ora è un sottile wrapper sul GameGate condiviso
 * (look "dark premium"). Passa solo l'identità del gioco: accento neon viola,
 * titolo bicolore TRI·VI·A, icona cervello, e lo storage del nick di Trivia.
 */
export default function NicknameGate({ dark, initial = "", onConfirm }: NicknameGateProps) {
  return (
    <GameGate
      dark={dark}
      accent={ACCENTS.trivia}
      title={<>TRI<span>VI</span>A</>}
      icon={<BrainCircuit size={44} />}
      storeNick={storeNick}
      initial={initial}
      onConfirm={onConfirm}
    />
  );
}
