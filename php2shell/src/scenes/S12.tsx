import React from "react";
import { DISSOLVE } from "../theme";
import { CUES, SCENES } from "../timeline";
import { useFrame } from "../clock";
import { Hold } from "../components/d-chat";
import { PhpCard, PluginCard } from "../components/d-cards";

// S12 "Aur dhyan rakhna... sirf plugin update karne se yeh theek nahi hota. PHP khud update karna padega."
// The first 2 s are S11's panel, still held (the same picture, drawn here from the moment S11's layer starts to fade, so it never dips);
// it leaves as the cards arrive on "plugin update".
const S11_LAYER_END = SCENES.find((s) => s.id === "S11")!.to;
export const S12: React.FC = () => {
  const f = useFrame();
  const hold = f >= S11_LAYER_END - DISSOLVE && f < CUES.S11.cue.exitEnd;
  return (<>{hold && <Hold />}<PluginCard /><PhpCard /></>);
};
