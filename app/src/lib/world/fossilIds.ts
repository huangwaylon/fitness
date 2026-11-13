// NH's 73 fossils (docs/design.md "Beach finds"): their ids, the standalone ones and the sets of pieces, in the
// game's order. Dependency-free: the island's digs (beach.ts), the ずかん and the museum's fossils (museum/fossils.ts).

/** NH's 14 standalone fossils. */
export const STANDALONE = [
  'amber', 'ammonite', 'trilobite', 'dinosaur-track', 'shark-tooth-pattern', 'coprolite', 'myllokunmingia', 'juramaia',
  'anomalocaris', 'archaeopteryx', 'dunkleosteus', 'eusthenopteron', 'acanthostega', 'australopith'
] as const;
/** NH's 21 fossils in pieces, each with its pieces in the game's order (the ずかん shows each as a set: 「Tレックス 2/3」). */
export const FOSSIL_SETS = {
  't-rex': ['t-rex-skull', 't-rex-torso', 't-rex-tail'],
  tricera: ['tricera-skull', 'tricera-torso', 'tricera-tail'],
  stego: ['stego-skull', 'stego-torso', 'stego-tail'],
  brachio: ['brachio-skull', 'brachio-chest', 'brachio-pelvis', 'brachio-tail'],
  mammoth: ['mammoth-skull', 'mammoth-torso'],
  sabertooth: ['sabertooth-skull', 'sabertooth-tail'],
  dimetrodon: ['dimetrodon-skull', 'dimetrodon-torso'],
  ankylo: ['ankylo-skull', 'ankylo-torso', 'ankylo-tail'],
  plesio: ['plesio-skull', 'plesio-torso', 'plesio-tail'],
  spino: ['spino-skull', 'spino-torso', 'spino-tail'],
  iguanodon: ['iguanodon-skull', 'iguanodon-torso', 'iguanodon-tail'],
  pachy: ['pachy-skull', 'pachy-tail'],
  diplo: ['diplo-skull', 'diplo-neck', 'diplo-chest', 'diplo-pelvis', 'diplo-tail', 'diplo-tail-tip'],
  ptera: ['ptera-body', 'left-ptera-wing', 'right-ptera-wing'],
  megacero: ['megacero-skull', 'megacero-torso', 'megacero-tail'],
  parasaur: ['parasaur-skull', 'parasaur-torso', 'parasaur-tail'],
  ophthalmo: ['ophthalmo-skull', 'ophthalmo-torso'],
  archelon: ['archelon-skull', 'archelon-tail'],
  deinony: ['deinony-torso', 'deinony-tail'],
  megalo: ['left-megalo-side', 'right-megalo-side'],
  quetzal: ['quetzal-torso', 'left-quetzal-wing', 'right-quetzal-wing']
} as const;
/** Every fossil to dig up (NH's 73): the standalone ones, then each set's pieces; each as likely as any other. */
export const FOSSILS = [...STANDALONE, ...Object.values(FOSSIL_SETS).flat()];
