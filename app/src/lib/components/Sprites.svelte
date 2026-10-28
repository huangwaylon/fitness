<script lang="ts">
  import VillagerArt from '#lib/villagers/VillagerArt.svelte';
  import IsabelleArt from '#lib/villagers/IsabelleArt.svelte';
  import { ROSTER } from '#lib/villagers/roster.ts';
</script>

<!-- SVG symbol library (v0.4 + v2). Rendered once in the root layout;
     use with <svg><use href="#f-peach" /></svg>. -->
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <defs>
    <!-- v0.4 avatar symbols, now drawn by the v2 character system (heads, viewBox 0 0 100 100) -->
    <symbol id="v-mochi" viewBox="9 1 82 82">
      <VillagerArt look={ROSTER.raymond} head animate={false} lw={3} />
    </symbol>
    <symbol id="v-bean" viewBox="9 1 82 82">
      <VillagerArt look={ROSTER.goldie} head animate={false} lw={3} />
    </symbol>
    <symbol id="v-juni" viewBox="6 -9 88 88">
      <IsabelleArt head animate={false} lw={3} />
    </symbol>

    <!-- しまフォン app-tile glyphs (style guide v2 §8): 24-grid, flat ink (currentColor, default --c-ink)
         with one white or accent detail. Use inside a coloured squircle. -->
    <symbol id="app-island" viewBox="0 0 24 24">
      <circle cx="18.6" cy="5.4" r="3" fill="#fff" />
      <path d="M2.5 20.2 Q12 13.6 21.5 20.2 Q21.6 21.6 20 21.6 H4 Q2.4 21.6 2.5 20.2 Z" fill="currentColor" />
      <path d="M10.3 18.4 Q9.6 13 11.6 8.6 L13.2 9.2 Q11.8 13.2 12.6 18.2 Z" fill="currentColor" />
      <path d="M12.4 8.8 Q8.6 5.2 3.6 7.4 Q8.2 7.4 10.4 10.4 Z M12.4 8.8 Q15.4 4.4 20.4 6.6 Q15.8 6.8 13.8 10 Z M12.4 8.8 Q11.6 3.8 7.6 2.6 Q10.4 5.6 11 9.4 Z M12.4 8.8 Q17 8.6 18.6 13.2 Q15.6 10.6 12.8 10.6 Z" fill="currentColor" />
    </symbol>
    <symbol id="app-jar" viewBox="0 0 24 24">
      <rect x="7" y="2" width="10" height="4" rx="1.6" fill="currentColor" />
      <path d="M8 6.8 H16 Q20 8.6 20 13 V18.4 Q20 21.6 16.8 21.6 H7.2 Q4 21.6 4 18.4 V13 Q4 8.6 8 6.8 Z" fill="currentColor" />
      <circle cx="12" cy="15" r="3.6" fill="#fff" />
      <path d="M12 13 V17 M10.6 15.4 H13.4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
    </symbol>
    <symbol id="app-us" viewBox="0 0 24 24">
      <path d="M9.5 21 C1.6 16.4 1.8 10 5 8.6 C7.2 7.6 8.8 8.8 9.5 10.2 C10.2 8.8 11.8 7.6 14 8.6 C17.2 10 17.4 16.4 9.5 21 Z" fill="currentColor" />
      <path d="M17 13.4 C12.6 10.8 12.8 6.8 14.8 6 C16 5.5 16.8 6.2 17 7 C17.4 6.2 18.2 5.5 19.4 6 C21.4 6.8 21.4 10.8 17 13.4 Z" fill="#fff" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
    </symbol>
    <symbol id="app-help" viewBox="0 0 24 24">
      <path d="M2 6 Q7 3.6 11.2 6 V20.4 Q7 18.2 2 20.2 Z M12.8 6 Q17 3.6 22 6 V20.2 Q17 18.2 12.8 20.4 Z" fill="currentColor" />
      <path d="M4.4 9.4 Q6.8 8.4 9 9.4 M4.4 12.4 Q6.8 11.4 9 12.4 M15 9.4 Q17.2 8.4 19.6 9.4" stroke="#fff" stroke-width="1.4" stroke-linecap="round" fill="none" />
    </symbol>
    <symbol id="app-villager" viewBox="0 0 24 24">
      <path d="M4.4 9.6 L4.6 3.4 Q4.8 2 6 2.8 L9.6 5.6 Z M19.6 9.6 L19.4 3.4 Q19.2 2 18 2.8 L14.4 5.6 Z" fill="currentColor" />
      <ellipse cx="12" cy="13" rx="9.6" ry="8.4" fill="currentColor" />
      <circle cx="8.6" cy="12.4" r="1.5" fill="#fff" /><circle cx="15.4" cy="12.4" r="1.5" fill="#fff" />
      <path d="M10.2 16 Q12 17.6 13.8 16" stroke="#fff" stroke-width="1.4" stroke-linecap="round" fill="none" />
    </symbol>
    <symbol id="app-lang" viewBox="0 0 24 24">
      <path d="M3.6 2.6 H13 Q15.4 2.6 15.4 5 V10.4 Q15.4 12.8 13 12.8 H8 L4.6 15.6 V12.8 H3.6 Q1.2 12.8 1.2 10.4 V5 Q1.2 2.6 3.6 2.6 Z" fill="currentColor" />
      <path d="M11 9.6 H20.4 Q22.8 9.6 22.8 12 V17.4 Q22.8 19.8 20.4 19.8 H19.4 V22.4 L16 19.8 H11 Q8.6 19.8 8.6 17.4 V12 Q8.6 9.6 11 9.6 Z" fill="#fff" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
      <path d="M5.2 5.2 H11 M8 4 Q7.4 8.6 5 10.6 M10.6 7.6 Q6.4 7 5.6 9.4 Q5.6 10.8 7.8 10.2 Q11 9.4 10.6 7.6 Z" stroke="#fff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <path d="M13 17.6 L15.7 11.8 L18.4 17.6 M14 15.6 H17.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    </symbol>
    <symbol id="app-bell" viewBox="0 0 24 24">
      <circle cx="12" cy="3.2" r="1.8" fill="currentColor" />
      <path d="M12 4 Q18.2 4 18.4 11 V15.4 L20.8 18.6 Q21.2 19.4 20.2 19.4 H3.8 Q2.8 19.4 3.2 18.6 L5.6 15.4 V11 Q5.8 4 12 4 Z" fill="currentColor" />
      <path d="M9.4 20.6 Q12 23.4 14.6 20.6 Z" fill="currentColor" />
      <path d="M8.4 8.4 Q9.2 6.6 11 6.2" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none" />
    </symbol>
    <symbol id="app-sync" viewBox="0 0 24 24">
      <path d="M19.4 9.4 A8 8 0 0 0 5.2 7.4" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" fill="none" />
      <path d="M4.6 14.6 A8 8 0 0 0 18.8 16.6" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" fill="none" />
      <path d="M2.6 3.8 L3.4 9.8 L9 7.6 Z M21.4 20.2 L20.6 14.2 L15 16.4 Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round" />
      <path d="M8.6 15.2 Q8.4 9 15.4 8.6 Q15.6 15 8.6 15.2 Z" fill="#fff" />
      <path d="M9.6 14.2 L13.4 10.4" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" />
    </symbol>

    <symbol id="f-apple" viewBox="0 0 24 24"><circle cx="12" cy="14" r="8" fill="#FF8A7A" stroke="#4A3A2C" stroke-width="1.8"/><path d="M12 6 Q12 3 14 2" stroke="#8A5A3B" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M13 5 Q17 2 19 5 Q16 7 13 5Z" fill="#7BC67E"/><circle cx="9" cy="11" r="1.8" fill="#fff" opacity=".7"/></symbol>
    <symbol id="f-peach" viewBox="0 0 24 24"><path d="M12 6 C4 6 3 15 6 18 C9 22 15 22 18 18 C21 15 20 6 12 6Z" fill="#FFB38A" stroke="#4A3A2C" stroke-width="1.8"/><path d="M12 7 Q10 13 12 20" stroke="#E8946A" stroke-width="1.4" fill="none"/><path d="M12 6 Q15 2 19 4 Q16 8 12 6Z" fill="#7BC67E"/><circle cx="8.5" cy="11" r="1.6" fill="#fff" opacity=".7"/></symbol>
    <symbol id="f-plum" viewBox="0 0 24 24"><circle cx="12" cy="14" r="8" fill="#9FA8E8" stroke="#4A3A2C" stroke-width="1.8"/><path d="M15 10 a4 4 0 1 0 2 5 a3 3 0 1 1 -2 -5z" fill="#F6E7B0"/><path d="M12 6 Q14 2 18 3" stroke="#8A5A3B" stroke-width="1.8" fill="none" stroke-linecap="round"/></symbol>
    <symbol id="f-pear" viewBox="0 0 24 24"><path d="M12 5 C9 5 9 9 8 11 C5 14 5 21 12 21 C19 21 19 14 16 11 C15 9 15 5 12 5Z" fill="#C9DE6E" stroke="#4A3A2C" stroke-width="1.8"/><path d="M12 5 Q12 2 14 1.5" stroke="#8A5A3B" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="9.5" cy="14" r="1.6" fill="#fff" opacity=".7"/></symbol>
    <symbol id="f-empty" viewBox="0 0 24 24"><circle cx="12" cy="13" r="8" fill="none" stroke="#7A6553" stroke-width="1.8" stroke-dasharray="3 3" opacity=".55"/></symbol>

    <symbol id="i-island" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20 Q12 15 21 20"/><path d="M12 18 Q11 12 13 7"/><path d="M13 7 Q8 4 4 7 M13 7 Q18 3 21 7 M13 7 Q11 3 8 3 M13 7 Q16 9 17 12"/></g></symbol>
    <symbol id="i-jar" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="3" width="10" height="3" rx="1.2"/><path d="M8 6 Q5 8 5 12 V18 Q5 21 8 21 H16 Q19 21 19 18 V12 Q19 8 16 6"/><circle cx="12" cy="15" r="2.6"/></g></symbol>
    <symbol id="i-bag" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8 H19 L18 20 Q18 21 17 21 H7 Q6 21 6 20 Z"/><path d="M9 10 V6 a3 3 0 0 1 6 0 V10"/></g></symbol>
    <symbol id="i-shell" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20 L4 11 Q6 4 12 4 Q18 4 20 11 Z"/><path d="M12 20 V5 M12 20 L8 6 M12 20 L16 6"/></g></symbol>
    <symbol id="i-us" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19 C3 15 3 10 5.5 8.5 C7.5 7.3 9 8.5 9 9.5 C9 8.5 10.5 7.3 12.5 8.5 C15 10 15 15 9 19Z"/><path d="M16 13.5 C19.5 11 20.5 8 19 6.5 C17.8 5.4 16.3 6 16 7 C15.7 6 14.2 5.4 13 6.5"/></g></symbol>
    <symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5 L10 17 L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="i-x" viewBox="0 0 24 24"><path d="M6 6 L18 18 M18 6 L6 18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></symbol>
    <symbol id="i-bowl" viewBox="0 0 48 48"><path d="M6 22 H42 Q41 38 24 40 Q7 38 6 22Z" fill="#FFF1DE" stroke="#4A3A2C" stroke-width="2.6" stroke-linejoin="round"/><path d="M14 22 Q14 12 22 14 Q20 20 18 22" fill="#7BC67E" stroke="#4A3A2C" stroke-width="2.2" stroke-linejoin="round"/><path d="M22 22 Q26 10 34 13 Q32 20 28 22" fill="#BFE5B9" stroke="#4A3A2C" stroke-width="2.2" stroke-linejoin="round"/><circle cx="34" cy="19" r="4" fill="#FF8A7A" stroke="#4A3A2C" stroke-width="2"/><path d="M14 30 Q24 34 34 30" stroke="#E9D8B4" stroke-width="2.4" fill="none" stroke-linecap="round"/></symbol>
    <symbol id="i-okbowl" viewBox="0 0 48 48"><ellipse cx="24" cy="30" rx="18" ry="10" fill="#FFE7A8" stroke="#4A3A2C" stroke-width="2.6"/><path d="M10 28 Q24 16 38 28" fill="#F2C48D" stroke="#4A3A2C" stroke-width="2.4"/><circle cx="18" cy="25" r="3.4" fill="#7BC67E" stroke="#4A3A2C" stroke-width="1.8"/><circle cx="28" cy="23" r="3" fill="#FF8A7A" stroke="#4A3A2C" stroke-width="1.8"/></symbol>
    <symbol id="i-treat" viewBox="0 0 48 48"><circle cx="24" cy="26" r="16" fill="#F2C48D" stroke="#4A3A2C" stroke-width="2.6"/><path d="M9 24 Q12 12 24 11 Q36 12 39 24 Q36 28 32 25 Q28 30 24 26 Q20 30 16 25 Q12 28 9 24Z" fill="#F28BA8" stroke="#4A3A2C" stroke-width="2.2" stroke-linejoin="round"/><circle cx="24" cy="26" r="5" fill="#FFF8E7" stroke="#4A3A2C" stroke-width="2.2"/><path d="M16 17 l2 1 M28 15 l2 -1 M33 20 l1 2 M20 14 l1 -2" stroke="#fff" stroke-width="2" stroke-linecap="round"/></symbol>
    <symbol id="i-flag" viewBox="0 0 24 24"><path d="M7 21 V4" stroke="#8A5A3B" stroke-width="2.4" stroke-linecap="round"/><path d="M8 4 H18 L15.5 7.5 L18 11 H8 Z" fill="currentColor" stroke="#4A3A2C" stroke-width="1.6" stroke-linejoin="round"/></symbol>
    <symbol id="i-ticket" viewBox="0 0 26 26"><path d="M3 8 Q3 6 5 6 H21 Q23 6 23 8 V10 Q21 10 21 13 Q21 16 23 16 V18 Q23 20 21 20 H5 Q3 20 3 18 V16 Q5 16 5 13 Q5 10 3 10Z" fill="#fff" stroke="#B04A3B" stroke-width="1.8"/><path d="M10 10 V16 M10 10 Q13 10 13 12 Q13 13.5 10 13.5 M16 10 V16" stroke="#B04A3B" stroke-width="1.8" fill="none" stroke-linecap="round"/></symbol>
    <symbol id="i-cake" viewBox="0 0 26 26"><path d="M4 13 H22 V21 H4Z" fill="#FFD9CF" stroke="#B04A3B" stroke-width="1.8" stroke-linejoin="round"/><path d="M4 16 Q7 18 10 16 Q13 18 16 16 Q19 18 22 16" stroke="#B04A3B" stroke-width="1.6" fill="none"/><path d="M13 13 V8" stroke="#B04A3B" stroke-width="1.8"/><path d="M13 4 Q15 6 13 8 Q11 6 13 4Z" fill="#FFD66B"/></symbol>

    <symbol id="jar" viewBox="0 0 60 72">
      <rect x="15" y="4" width="30" height="9" rx="3" fill="#F2B53A" stroke="#4A3A2C" stroke-width="2.4"/>
      <path d="M17 13 Q8 18 8 30 V60 Q8 68 16 68 H44 Q52 68 52 60 V30 Q52 18 43 13 Z" fill="#DDF2FB" fill-opacity=".85" stroke="#4A3A2C" stroke-width="2.4"/>
      <clipPath id="jarclip"><path d="M17 13 Q8 18 8 30 V60 Q8 68 16 68 H44 Q52 68 52 60 V30 Q52 18 43 13 Z"/></clipPath>
      <g clip-path="url(#jarclip)">
        <rect x="0" y="42" width="60" height="30" fill="#FFD66B"/>
        <g fill="#F2B53A" stroke="#C98E1D" stroke-width="1.2"><ellipse cx="16" cy="44" rx="7" ry="3"/><ellipse cx="30" cy="42" rx="7" ry="3"/><ellipse cx="44" cy="45" rx="7" ry="3"/><ellipse cx="23" cy="50" rx="7" ry="3"/><ellipse cx="38" cy="51" rx="7" ry="3"/></g>
      </g>
      <path d="M14 26 Q13 34 14 40" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>
      <path d="M22 30 Q30 24 38 30 Q30 36 22 30Z" fill="#7BC67E" stroke="#4A3A2C" stroke-width="1.8"/>
    </symbol>

    <symbol id="tree" viewBox="0 0 120 140">
      <path d="M54 136 Q56 100 52 80 H68 Q64 100 66 136 Z" fill="#8A5A3B" stroke="#4A3A2C" stroke-width="2.5" stroke-linejoin="round"/>
      <g stroke="#4A3A2C" stroke-width="2.5">
        <circle cx="60" cy="52" r="40" fill="#4E9A55"/>
        <circle cx="32" cy="64" r="24" fill="#5FAE63"/>
        <circle cx="88" cy="64" r="24" fill="#5FAE63"/>
        <circle cx="60" cy="40" r="30" fill="#7BC67E"/>
      </g>
      <path d="M44 28 Q52 20 62 22" stroke="#BFE5B9" stroke-width="4" fill="none" stroke-linecap="round"/>
    </symbol>
    <symbol id="f-coconut" viewBox="0 0 24 24"><circle cx="12" cy="14" r="8" fill="#9C6B45" stroke="#4A3A2C" stroke-width="1.8"/><path d="M6 11 Q12 7 18 11" stroke="#7A5234" stroke-width="1.4" fill="none"/><circle cx="10" cy="12.5" r="1.1" fill="#4A3A2C"/><circle cx="14" cy="12.5" r="1.1" fill="#4A3A2C"/><circle cx="12" cy="15.5" r="1.1" fill="#4A3A2C"/><path d="M12 6 Q14 2 19 3 Q16 7 12 6Z" fill="#7BC67E"/><circle cx="8.2" cy="16" r="1.4" fill="#fff" opacity=".35"/></symbol>
    <symbol id="i-veg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#DDF2D8"/><path d="M12 28 Q11 18 20 12 Q26 20 20 28Z" fill="#7BC67E" stroke="#4A3A2C" stroke-width="2" stroke-linejoin="round"/><path d="M14 27 Q17 20 20 14" stroke="#4E9A55" stroke-width="1.6" fill="none"/><circle cx="26" cy="25" r="5" fill="#FF8A7A" stroke="#4A3A2C" stroke-width="2"/></symbol>
    <symbol id="i-drink" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#DDF2FB"/><path d="M13 12 H27 L25 31 Q25 32 24 32 H16 Q15 32 15 31Z" fill="#fff" stroke="#4A3A2C" stroke-width="2" stroke-linejoin="round"/><path d="M14.5 19 H25.5 L24.6 30 H15.4Z" fill="#8FD3F4"/><path d="M22 8 L20 18" stroke="#FF9B87" stroke-width="2.2" stroke-linecap="round"/></symbol>
    <symbol id="i-pot" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#FFF0DA"/><path d="M9 19 H31 V26 Q31 31 26 31 H14 Q9 31 9 26Z" fill="#FF9B87" stroke="#4A3A2C" stroke-width="2" stroke-linejoin="round"/><path d="M7 19 H33" stroke="#4A3A2C" stroke-width="2.2" stroke-linecap="round"/><path d="M15 15 Q14 12 16 10 M20 15 Q19 11 21 9 M25 15 Q24 12 26 10" stroke="#B9A48A" stroke-width="1.8" fill="none" stroke-linecap="round"/></symbol>
    <symbol id="i-cozy" viewBox="0 0 24 24"><path d="M16 4 a8 8 0 1 0 4 12 a6.5 6.5 0 1 1 -4 -12z" fill="#9FA8E8" stroke="#4A3A2C" stroke-width="1.6" stroke-linejoin="round"/><path d="M4 20 Q12 16 20 20" stroke="#B79CE0" stroke-width="2.4" fill="none" stroke-linecap="round"/></symbol>
    <symbol id="i-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11 V17 M12 7.5 V8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></symbol>
    <symbol id="i-film" viewBox="0 0 40 40"><rect x="7" y="11" width="26" height="19" rx="4" fill="#B79CE0" stroke="#4A3A2C" stroke-width="2"/><path d="M7 16 H33 M7 25 H33" stroke="#4A3A2C" stroke-width="1.6"/><path d="M17 18 L24 20.5 L17 23Z" fill="#fff"/></symbol>
    <symbol id="i-spa" viewBox="0 0 40 40"><path d="M20 30 Q10 26 9 16 Q16 17 20 24 Q24 17 31 16 Q30 26 20 30Z" fill="#8ED9C0" stroke="#4A3A2C" stroke-width="2" stroke-linejoin="round"/><path d="M20 24 Q16 16 20 9 Q24 16 20 24Z" fill="#BFE5B9" stroke="#4A3A2C" stroke-width="2" stroke-linejoin="round"/></symbol>
    <symbol id="i-chef" viewBox="0 0 40 40"><path d="M12 24 Q6 22 8 16 Q10 11 15 13 Q17 8 22 9 Q27 9 28 14 Q34 13 33 19 Q32 23 28 24Z" fill="#fff" stroke="#4A3A2C" stroke-width="2" stroke-linejoin="round"/><rect x="13" y="24" width="15" height="7" rx="2" fill="#fff" stroke="#4A3A2C" stroke-width="2"/></symbol>
    <symbol id="i-plant" viewBox="0 0 40 40"><path d="M13 24 H27 L25 33 H15Z" fill="#E2604E" stroke="#4A3A2C" stroke-width="2" stroke-linejoin="round"/><path d="M20 24 V14" stroke="#4E9A55" stroke-width="2.2"/><path d="M20 17 Q12 16 11 9 Q18 9 20 17Z M20 15 Q27 13 29 7 Q22 7 20 15Z" fill="#7BC67E" stroke="#4A3A2C" stroke-width="1.8" stroke-linejoin="round"/></symbol>
    <symbol id="i-purse" viewBox="0 0 48 48"><path d="M8 20 Q8 14 14 14 H34 Q40 14 40 20 V34 Q40 40 34 40 H14 Q8 40 8 34Z" fill="#FF9B87" stroke="#4A3A2C" stroke-width="2.6" stroke-linejoin="round"/><path d="M16 14 Q16 6 24 6 Q32 6 32 14" fill="none" stroke="#4A3A2C" stroke-width="2.6"/><circle cx="20" cy="15" r="3" fill="#F2B53A" stroke="#4A3A2C" stroke-width="2"/><circle cx="28" cy="15" r="3" fill="#F2B53A" stroke="#4A3A2C" stroke-width="2"/><path d="M15 28 Q24 33 33 28" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/></symbol>
    <symbol id="i-yakiniku" viewBox="0 0 48 48"><ellipse cx="24" cy="30" rx="18" ry="9" fill="#5A4A3E" stroke="#4A3A2C" stroke-width="2.4"/><path d="M8 27 H40 M10 31 H38" stroke="#8A7A6E" stroke-width="1.6"/><path d="M14 24 Q18 19 24 22 Q20 27 14 24Z" fill="#E2604E" stroke="#4A3A2C" stroke-width="2"/><path d="M25 22 Q30 17 35 21 Q31 26 25 22Z" fill="#FF8A7A" stroke="#4A3A2C" stroke-width="2"/><path d="M18 14 Q16 10 19 7 M26 13 Q24 9 27 6" stroke="#B9A48A" stroke-width="2" fill="none" stroke-linecap="round"/></symbol>
    <symbol id="i-cafe" viewBox="0 0 48 48"><path d="M10 18 H34 V30 Q34 38 26 38 H18 Q10 38 10 30Z" fill="#fff" stroke="#4A3A2C" stroke-width="2.6" stroke-linejoin="round"/><path d="M34 21 Q41 21 40 27 Q39 32 34 31" fill="none" stroke="#4A3A2C" stroke-width="2.6"/><ellipse cx="22" cy="20" rx="10" ry="2.4" fill="#A8754E"/><path d="M19 23 Q22 27 25 23" stroke="#F28BA8" stroke-width="2" fill="none"/><path d="M17 13 Q15 9 18 6 M25 12 Q23 8 26 5" stroke="#B9A48A" stroke-width="2" fill="none" stroke-linecap="round"/></symbol>
    <symbol id="i-onsen" viewBox="0 0 48 48"><path d="M6 30 Q6 40 24 40 Q42 40 42 30Z" fill="#8FD3F4" stroke="#4A3A2C" stroke-width="2.6" stroke-linejoin="round"/><path d="M15 24 Q12 19 15 14 Q18 9 15 5 M24 24 Q21 19 24 14 Q27 9 24 5 M33 24 Q30 19 33 14 Q36 9 33 5" stroke="#E2604E" stroke-width="2.6" fill="none" stroke-linecap="round"/></symbol>
    <symbol id="i-undo" viewBox="0 0 24 24"><path d="M9 7 L4 11 L9 15 M4 11 H14 Q20 11 20 16 Q20 20 15 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="i-snack" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#FFF0DA"/><circle cx="15" cy="22" r="7" fill="#FFB347" stroke="#4A3A2C" stroke-width="2"/><path d="M15 15 Q17 12 20 13" stroke="#7BC67E" stroke-width="2.2" fill="none" stroke-linecap="round"/><ellipse cx="27" cy="25" rx="4" ry="6" transform="rotate(25 27 25)" fill="#C1915F" stroke="#4A3A2C" stroke-width="2"/><ellipse cx="25" cy="15" rx="3" ry="4.5" transform="rotate(-20 25 15)" fill="#C1915F" stroke="#4A3A2C" stroke-width="2"/></symbol>
    <!-- app additions (same 2–2.6px brown-ink stroke language) -->
    <symbol id="i-tray" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#FFF0DA"/><rect x="5" y="22" width="30" height="10" rx="3" fill="#C1915F" stroke="#4A3A2C" stroke-width="2"/><path d="M9 22 Q9 15 15 15 Q21 15 21 22Z" fill="#fff" stroke="#4A3A2C" stroke-width="2"/><path d="M22 22 Q22 17 27 17 Q32 17 32 22Z" fill="#FF9B87" stroke="#4A3A2C" stroke-width="2"/><circle cx="13" cy="13" r="2" fill="#7BC67E"/></symbol>
    <symbol id="i-salt" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#DDF2FB"/><path d="M14 16 Q14 10 20 10 Q26 10 26 16 V30 Q26 32 24 32 H16 Q14 32 14 30Z" fill="#fff" stroke="#4A3A2C" stroke-width="2" stroke-linejoin="round"/><path d="M14 17 H26" stroke="#4A3A2C" stroke-width="2"/><circle cx="18" cy="13" r="1" fill="#4A3A2C"/><circle cx="22" cy="13" r="1" fill="#4A3A2C"/><path d="M30 12 L33 9 M31 17 H35" stroke="#7BC67E" stroke-width="2.2" stroke-linecap="round"/></symbol>
    <symbol id="i-mic" viewBox="0 0 48 48"><rect x="17" y="6" width="14" height="20" rx="7" fill="#B79CE0" stroke="#4A3A2C" stroke-width="2.6"/><path d="M12 22 Q12 33 24 33 Q36 33 36 22" fill="none" stroke="#4A3A2C" stroke-width="2.6" stroke-linecap="round"/><path d="M24 33 V41 M17 41 H31" stroke="#4A3A2C" stroke-width="2.6" stroke-linecap="round"/><path d="M38 9 l2 -3 M41 14 h3" stroke="#F2B53A" stroke-width="2.4" stroke-linecap="round"/></symbol>
    <symbol id="i-hike" viewBox="0 0 48 48"><path d="M4 38 L18 14 L26 26 L32 18 L44 38Z" fill="#7BC67E" stroke="#4A3A2C" stroke-width="2.6" stroke-linejoin="round"/><path d="M14 21 L18 14 L22 20 L19 19Z" fill="#fff"/><circle cx="37" cy="10" r="4" fill="#FFD66B" stroke="#4A3A2C" stroke-width="2"/></symbol>
    <symbol id="i-heart" viewBox="0 0 24 24"><path d="M12 20 C4 15 3 9 6.5 7 C9 5.6 11 7 12 8.6 C13 7 15 5.6 17.5 7 C21 9 20 15 12 20Z" fill="currentColor" stroke="#4A3A2C" stroke-width="1.6" stroke-linejoin="round"/></symbol>
    <symbol id="i-bell" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16 V11 a6 6 0 0 1 12 0 V16 L19.5 18 H4.5Z"/><path d="M10 20.5 Q12 22 14 20.5"/></g></symbol>
    <symbol id="i-globe" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12 H20.5 M12 3.5 Q7 12 12 20.5 Q17 12 12 3.5"/></g></symbol>
    <symbol id="i-sync" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9 A7.5 7.5 0 0 0 5.5 8 M5 15 A7.5 7.5 0 0 0 18.5 16"/><path d="M5 4 V8.5 H9.5 M19 20 V15.5 H14.5"/></g></symbol>
    <symbol id="i-eye" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12 Q12 3 21.5 12 Q12 21 2.5 12Z"/><circle cx="12" cy="12" r="3"/></g></symbol>
    <symbol id="i-pencil" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20 L5 15.5 L15.5 5 a2.1 2.1 0 0 1 3 3 L8 18.5Z"/><path d="M13.5 7 L16.5 10"/></g></symbol>
  </defs>
</svg>
