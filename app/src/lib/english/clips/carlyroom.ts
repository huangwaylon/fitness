// “Carly Shay's $82,000 Room Makeover! 🤑🔥 iCarly | NickRewind” (NickRewind, Best of iCarly): a narrator walks through
// the episode: a gummy-bear lamp, a birthday gift, sets Carly's room on fire; insurance on a watch pays out, and Spencer
// and friends rebuild the room. The narrator then tours its features (chandelier, trampoline bed, water table,
// ice-cream-sandwich loveseat, hair-dryer wall) with a running commentary of jokes.
// Segments from the captions, words from whisper (2026-11-16). Most items rest on the narrator, one voice that both
// sources agree on. Speakers other than the narrator aren't named in the audio, so items say "a friend" or "the
// lamp's maker" and no item depends on who they are.
// Untested on purpose: 0–4 s (whisper "tough straights", captions "tough scrapes"), 93–96 s (the watch's maker),
// 135–144 s (the chandelier lines are whisper only; captions have music and "great no time"), 154–179 s (the
// season-one callback, church pants and cousin Annie need backstory), 196–206 s (trampoline slapstick), 240–248 s
// (captions garbled: "second oh it happened", "hike… some"), 289–308 s (song and channel outro).
// REVIEW 2026-11-17 (2nd review; earlier R fixes were from the first): pass 10, fix 12, drop 1, new 1; ear checks 2
// Open: f1 was still at 70 % on the cold re-read (a narrator's flashback is the expected move). d1 and d2 were
//   picked only through other items (the i1/f1 stems, g1's "homemade gift"), and those share a point or a reveal, so
//   they're never drawn together. g1 is now a 2 × 2, the bank's only 4-choice sentence item.
// EAR CHECK: 193.7 s r1 — the cut falls after “additions” and before “but”
// EAR CHECK: 220.9 s h4 — “loveseat” (captions) vs “lovesy” (whisper); the joke needs “loveseat”
import type { Clip } from '../types.ts';

export const carlyRoom: Clip = {
  id: 'carlyroom', video: 'tKK39FaCzzA', title: 'Carly Shay\'s $82,000 Room Makeover! 🤑🔥 iCarly | NickRewind',
  dur: 308, wpm: 155, band: 'mid', tags: ['家'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // R fix: V2 — the key shared "gift" with one distractor and the party one differed twice, so the odd-one-out
    //   pointed at it; now three distinct causes and three payers. Second pass (cold read 70 %: insurance was the
    //   only realistic payer): "her friends" becomes a TV makeover show, which the title invites
    // R fix: V2 (3rd pass) — blind 65 %: insurance was still the only realistic payer for a fire. Now a full 2 × 2
    //   (gift/wire × insurance/Spencer), so no choice wins on realism or on sharing the most with the others
    // why: wire ← "light switch" said near the lamp; Spencer pays ← "Spencer and friends rebuild" heard, the
    //   insurance money missed
    { id: 'g1', skill: 'gist', level: 'B1', point: 'chain', reveals: ['gift', 'lamp'], seg: [0, 102.5],
      stem: 'How does Carly end up with a brand-new room?',
      choices: ['A homemade gift starts a fire, and insurance pays to rebuild',
                'A homemade gift starts a fire, and Spencer pays to rebuild',
                'A faulty wire starts a fire, and insurance pays to rebuild',
                'A faulty wire starts a fire, and Spencer pays to rebuild'], a: 0,
      cue: '火事の原因と、最後に出てくる大きな金額の出どころ。',
      said: '誕生日の贈り物のランプから火が出て、保険金がおりる。',
      mean: 'お金は保険から。友だちは作り直す手伝いをした側。',
      trap: 'Spencer and friends rebuilt が耳に残ると、払ったのも彼らに思える。お金は reimbursement の話。',
      use: 'Will the insurance cover it?（保険でまかなえる？）' },

    // why: candles ← a birthday story, and "table" is said; wires ← "light switch" comes up later, near the lamp
    { id: 'd1', skill: 'detail', level: 'B1', point: 'lamp', seg: [14.6, 21.0],
      stem: 'What does the man looking at the damage say started the fire?',
      choices: ['A lamp on the bedside table', 'Candles on the bedside table', 'Wires behind the bedside table'], a: 0,
      cue: '「fixer-upper」のあと、「started the fire」の前。',
      line: 'This bedside table *lamp* started the fire.',
      said: '「このベッド脇のテーブルランプが火元だ」と言う。',
      mean: 'bedside table ＝ ベッド脇の小さな台。その上のランプが原因。',
      trap: 'bedside table が長くて目立つので、台の上の何かを聞き落としやすい。名詞は最後の語が中心。',
      use: 'Is there a lamp by the bed?（ベッドの横にランプある？）' },

    // R fix: K1 — "she thinks the man is not telling the truth" was defensible from her contradiction; choices now
    //   all say what the line shows about the lamp
    // R fix: V2 — blind 50 %, helped by f1's stem ("Carly says she has no lamp"); f1 no longer says it, and "never
    //   switched it on" becomes "kept it in another room", a closer reading of "don't have a *table* lamp"
    // why: threw it out ← "I don't have" heard as "I no longer have"; another room ← "table" stressed, as if she has
    //   the lamp but not by the bed
    { id: 'i1', skill: 'infer', level: 'C1', point: 'nolamp', reveals: ['lamp'], seg: [14.6, 22.8],
      stem: 'What does Carly’s reply to the man suggest about the lamp?',
      choices: ['It was put in her room without her knowing', 'She had thrown it out some time before',
                'It was hers, but she kept it in another room'], a: 0,
      cue: '「A lamp?」のあとの一文、持っているかどうか。',
      line: 'A lamp? But *I don’t have a table lamp*.',
      said: '「ランプ？でも私、テーブルランプなんて持ってない」と言う。',
      mean: '自分の物でないランプが部屋にあった。誰かが黙って置いた、という話につながる。',
      trap: 'don’t have は「もう持っていない」ではなく「もともとない」。自分の物なら、ないとは言わない。',
      use: 'That’s not mine. Where did it come from?（私のじゃない。どこから来たの？）' },

    // R fix: V2/K5 — "the lamp should be returned" wasn't a move in the story; now the retract reading of take it back.
    //   Second pass (cold read 70 % from “Hold up” in the stem): the stem names the moment by Carly's line instead
    // R fix: V2/N7 (3rd pass) — blind 55 %, and the stem gave away i1 (she has no lamp); the stem names the moment
    //   only, and "check the facts" becomes "skips ahead", the opposite move a flashback could be
    // why: skips ahead ← "Let's take it…" heard as "let's take it on", and the narrator does say "Moving on" later;
    //   retracts ← take it back = 前言撤回
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'takeback', seg: [23.7, 33.6],
      stem: 'Right after Carly answers the man, what does the narrator do with the story?',
      choices: ['He goes back to where it all began', 'He skips ahead to how it all ended',
                'He takes back what he has just said'], a: 0,
      cue: '「Hold up」のすぐあとの三語と、続く文の始まり。',
      line: 'Hold up. *Let’s take it back*. … You see, it all started with…',
      said: '「ちょっと待って、時間を戻そう。そもそもの始まりは…」と言う。',
      mean: 'take it back ＝ 話を前に戻す。ここから火事の前の話。',
      trap: 'take it back は「前言を取り消す」でもよく使う。直後の it all started が答え合わせ。',
      use: 'Let’s take it back to the start.（最初に戻ろう）' },

    // why: bought ← made/bought both fit a gift, and "made" is short; won ← "birthday" heard, the maker's words missed
    { id: 'd2', skill: 'detail', level: 'B1', point: 'gift', reveals: ['lamp'], seg: [33.55, 37.6],
      stem: 'What do we learn about the gummy bear lamp?',
      choices: ['Someone made it as a gift for Carly', 'Someone bought it as a gift for Carly',
                'Carly won it as a prize on her birthday'], a: 0,
      cue: '「Yeah」のあと、短い動詞ひとつ。',
      line: 'Yeah, I *made it* for Carly’s birthday.',
      said: '「うん、カーリーの誕生日に作ったんだ」と答える。',
      mean: '手作りの贈り物。この手作りが、あとで火事の原因になる。',
      trap: 'made は短く弱いので、贈り物と聞くと bought で補いやすい。動詞の最初の音を聞く。',
      use: 'I made it myself.（自分で作ったんだ）' },

    // why: 9/15/50 ← five/nine near sound and the -teen/-ty pair
    // R fix: B1 — the stem names the lamp, d1's key; reveals it
    { id: 'n2', skill: 'number', level: 'B1', point: 'pound', reveals: ['lamp'], seg: [37.55, 45.95], keep: true,
      stem: 'How heavy is the gummy bear at the base of the lamp?',
      choices: ['five pounds', 'nine pounds', 'fifteen pounds', 'fifty pounds'], a: 0,
      cue: '「one of those」のあと、重さの単位の前。',
      line: 'one of those *five-pound* gummy bears as the base',
      said: '台座には、あの5ポンドの大きなグミベアが使われている、と言う。',
      mean: '約2キロ強。ランプがほぼお菓子でできている。',
      trap: 'five は弱いと nine に近く聞こえる。fifteen は後ろが強く、fifty は前が強い。',
      use: 'It weighs about five pounds.（5ポンドくらいあるよ）' },

    // R note: "Polite, but not a fan" is the Japanese frame: a preface heard as the start of a criticism
    // R fix: K6 — the key was the only choice with "a little"
    // why: worried ← hindsight (the fire comes next); not a fan ← "not gonna lie" heard as the lead-in to criticism
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'notlie', seg: [45.25, 50.45],
      stem: 'How does a friend feel on first seeing the lamp?',
      choices: ['Impressed, and wanting one just like it', 'Impressed, but worried it isn’t safe',
                'Polite, but secretly not a fan of it'], a: 0,
      cue: '前置きの三語のあと、二つの短い文。',
      line: 'Not gonna lie, *I want this too*. *I love this*.',
      said: '「正直に言うと、これ私も欲しい。大好き」と言う。',
      mean: 'not gonna lie は本音の前置き。ここでは「うらやましい」を正直に言っている。',
      trap: '正直に言うと、は日本語だと批判の前置きになりやすい。英語では、ほめる本音にもよく付く。',
      use: 'Not gonna lie, I’m a bit jealous.（正直、ちょっとうらやましい）' },

    // R fix: K2 (2nd review) — the key's "for him" assumed the speaker's sex, which the words don't settle
    // R fix: S1/N7 — "the lamp's maker" in the stem gave away d2 (made) and names d1's lamp
    // why: offering ← do me a favor heard as "let me do you a favor"; thanking ← "Thanks" comes first, so the
    //   whole turn sounds like thanks
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'favor', reveals: ['lamp'], seg: [50.2, 56.5],
      stem: 'Right after “Thanks”, what is the speaker doing?',
      choices: ['Asking a friend to do something', 'Offering to do something for a friend',
                'Thanking a friend for something done before'], a: 0,
      cue: '「hey」のあとの決まり文句と、続く命令の形。',
      line: 'Hey, *do me a favor*. Take it upstairs…',
      said: '「ねえ、頼みがある。これを上に持って行って…」と言う。',
      mean: 'do me a favor ＝ お願いの前置き。続く命令形の文が、頼みの中身。',
      trap: 'favor を「親切」と取ると、こちらが何かしてあげる話に聞こえる。me が受け取る側。',
      use: 'Could you do me a favor?（ちょっとお願いしていい？）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'plug', seg: [50.2, 56.5],
      stem: 'Type the step before turning it on: “___ and turn it on.” (3 words)', answer: 'plug it in',
      cue: '「Carly’s bed」のすぐあと。三語がひと続き。',
      line: '…by Carly’s bed, *plug it in* and turn it on.',
      said: '「カーリーのベッド脇に置いて、コンセントに差して、つけて」と頼む。',
      mean: 'plug it in ＝ コンセントに差す。it は短い。',
      trap: '三語がつながり「プラギリン」に近い。t は弾んで、it in がひとつの音に聞こえる。',
      use: 'Can you plug in my phone?（スマホ、充電につないでくれる？）' },

    // R fix: V1 — gelatin's melting point (35 °C = 95 °F) is world knowledge (cold read picked it at 60 %); the item
    //   now asks the bulb's temperature, which no one knows offhand
    // R fix: N6 — notes were 140, now ≤ 120
    // why: 215 ← two-fifteen/two-fifty, the -teen/-ty pair; 150/350 ← the "hundred" heard, the first digit missed
    { id: 'n1', skill: 'number', level: 'B1', point: 'melt', seg: [59.35, 70.2], keep: true,
      stem: 'How hot does the narrator say a typical bulb’s surface gets?',
      choices: ['150 °F', '215 °F', '250 °F', '350 °F'], a: 2,
      cue: '「light bulb surface gets up to」のすぐあと。',
      line: 'while your typical light bulb surface gets up to *250 degrees* Fahrenheit',
      said: 'グミは95°Fで溶けるが、電球の表面は250°Fまで上がる、と言う。',
      mean: '約120℃。溶けて当然という前ふり。',
      trap: 'two-fifty と two-fifteen は -ty と -teen の差。fifty は前、fifteen は後ろが強い。',
      use: 'It melts at body temperature.（体温くらいで溶けるよ）' },

    // R fix: V2 — the stem quoted the "considering…" lead-in and only the key said fire would come; choices now all
    //   about the fire, and the stem names the moment without the lead-in
    //   Second pass (cold read 75 %: "bad luck" clashed with the science just before): now "never left switched on",
    //   a conclusion the temperatures also invite
    // R fix: V2 (3rd pass) — blind 55 %: "a short time later" was the odd literal one out; now "nobody could have seen
    //   it coming", the reading of a sudden fire that the idiom reverses
    // why: unforeseeable ← "matter of time" heard as "it just happened one day"; never left on ← the bulb's heat just
    //   described, so a "lesson" sounds like the natural close
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'matter', reveals: ['melt', 'lamp'], seg: [70.1, 76.8],
      stem: 'After the two temperatures, how does the narrator sum up?',
      choices: ['Sooner or later, it was going to catch fire', 'Nobody could have seen the fire coming',
                'It should never have been left switched on'], a: 0,
      cue: '「considering」の文の後半、最後の四語。',
      line: 'considering how gummy that lamp is, it was *only a matter of time*.',
      said: '「グミだらけのランプなら、時間の問題だった」と言う。',
      mean: 'only a matter of time ＝ いつかは必ず起きる。原因は前の温度の話。',
      trap: '予想外の事故や教訓と取りやすい。only a matter of time は「必ず起きる」の型。',
      use: 'It’s only a matter of time.（時間の問題だよ）' },

    // R new: c3 (C2, exact weak words in fast speech), replacing c2
    // anchor: 80.9–82.0 s captions "time to let out all those emotions", whisper "it's probably time to let out all
    //   those emotions before fixing things up": both agree on the four words; t-flap and linking run them together
    { id: 'c3', skill: 'dict', level: 'C2', point: 'letout', seg: [78.6, 83.7],
      stem: 'Type: “It’s probably time to ___ emotions.” (4 words)', answer: 'let out all those',
      cue: '「time to」のすぐあと、四語がひと続き。',
      line: 'it’s probably time to *let out all those* emotions before fixing things up.',
      said: '「直す前に、まずは気持ちを全部出したほうがいい」と言う。',
      mean: 'let out ＝ 外に出す。let‿out‿all がつながり「レダウドール」に近い。',
      trap: 't が弾んで語の切れ目が消え、語数を数えにくい。弱い those も聞き落としやすい。',
      use: 'Let it all out. You’ll feel better.（全部吐き出しな。楽になるよ）' },

    // R fix: V2/§9.6 — the key was the only unhedged, all-positive choice; asked now as what the tour does, with
    //   the title's price and "makeover" as traps
    //   Second pass (cold read 65 % on the upbeat tone): "explains costs" becomes mocking each feature as too much
    // R fix: V2 (3rd pass) — blind 50 %: the key alone had the two-part "…, joking as he goes"; all three now share
    //   it, and "compares with the old room" becomes pricing each feature, which the title's $82,000 invites.
    //   Notes trimmed to ≤ 120
    // why: prices ← the title's "$82,000" and the insurance sum; mocks ← a joking narrator, "hazard warning" and
    //   "very hard to place your coffee onto"
    { id: 'g2', skill: 'gist', level: 'B2', point: 'verdict', reveals: ['neversaw'], seg: [103.0, 280.3],
      stem: 'Through the tour of the new room, what does the narrator mostly do?',
      choices: ['Cheers on each feature, joking as he goes', 'Prices each feature, joking as he goes',
                'Mocks each feature, joking as he goes'], a: 0,
      cue: '設備ごとの紹介のしめくくり方。',
      said: 'シャンデリアからドライヤーの壁まで、冗談まじりにほめ続ける。',
      mean: '値段の話は出ない。冗談は笑いものにするためでなく、ほめ言葉の一部。',
      trap: '題名の金額から値段を、hazard などから皮肉を予想しやすい。beyond epic は本気のほめ言葉。',
      use: 'It’s over the top, and I love it.（やりすぎだけど、最高）' },

    // why: remembers ← "season one" comes up later, so it sounds like he knows the old room; told ← "we never
    //   saw" heard, "judging by" missed, so he must rely on others
    { id: 'i2', skill: 'infer', level: 'B2', point: 'neversaw', seg: [106.6, 117.5],
      stem: 'After his bit of trivia, how can the narrator still call it an upgrade?',
      choices: ['He judges only by how good the new room is', 'He compares it with the room in early episodes',
                'He goes by what friends told him about it'], a: 0,
      cue: '「trivia」のあと「but」で始まる文。',
      line: 'we *never saw* what Carly’s original bedroom looked like. But *judging by everything in there now*…',
      said: '「前の部屋は映らなかった。でも今の部屋を見る限り、最高の格上げ」と言う。',
      mean: '比べる前の部屋はない。今の部屋の豪華さだけで、格上げと決めている。',
      trap: 'never saw は前の部屋の話。but のあとで言い切っていて、取り消してはいない。',
      use: 'Judging by the photos, it’s huge.（写真で見る限り、すごく広い）' },

    // R fix: V2 — "on his own words" made "made up a word" the only fitting reason; all three are now doubts he
    //   might voice, one drawn from the "never saw the old room" line just before
    // R fix: V2 (2nd pass) — blind 55 %: only the key was about words; all three are now doubts about his wording
    // why: said it right ← "a word?" heard as checking his pronunciation; "upgrade" ← the base word heard, the -iest
    //   missed, as if he doubts "upgrade" is fair
    { id: 'h1', skill: 'humor', level: 'C1', point: 'upgradiest', seg: [112.05, 122.75],
      stem: 'Why does the narrator pause to question himself after praising the upgrade?',
      choices: ['He’s unsure the word he just used is real', 'He’s unsure he said the word the right way',
                'He’s unsure “upgrade” is the right word for it'], a: 0,
      cue: '「as you can get」の前の語と、その少しあとの質問。',
      line: 'about as *upgradiest* of an upgrade as you can get. … *Is upgradiest a word?*',
      said: '「最高に upgradiest な格上げ」と言い「それ単語？」と聞く。',
      mean: 'upgrade に -iest を付けた造語。勢いで作って自分でつっこむ笑い。',
      trap: 'upgrade だけ拾うと、言い方や語選びの話に聞こえる。疑うのは -iest の語。',
      use: 'Is that even a word?（それって言葉としてある？）' },

    // R drop: m1 (V2) — blind pick at 85 %: "drops the side question and moves on" was the only reading of anyway
    //   that fit the stem; no strong second function exists here. Marker isn't a required skill.

    // R fix: V2 — the key glossed the idiom twice over ("fully", "don't hold back"); now concrete, with a "safe"
    //   trap from the fire-retardant line just before
    // R fix: V2/K6 — blind 55 %: "never" was an absolute in a distractor only; the time reading is reworded
    // why: as long as you can ← all the way = ずっと, read as time; only while safe ← "no risk of catching fire" just
    //   before
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'theme', seg: [144.55, 148.55],
      stem: 'What does the narrator say to do if you have a theme?',
      choices: ['Carry it into every part of the room', 'Stick with it for as long as you can',
                'Push it only as far as it stays safe'], a: 0,
      cue: '「I mean, hey」のあと、最後の五語。',
      line: 'if you have a theme, *go all the way with it*.',
      said: '「テーマがあるなら、とことんやれ」と言う。',
      mean: 'go all the way ＝ 中途半端にせず徹底する。グミ尽くしの部屋をほめている。',
      trap: 'all the way を「ずっと」と時間で取りやすい。ここは期間でなく、やり方の徹底。',
      use: 'If you’re doing it, go all the way.（やるなら徹底的に）' },

    // R fix: V2 — "really does" in the key echoed "literally"
    // why: tired ← "after a hard day" heard as the point; high bed ← "jump into bed" heard as climbing up
    { id: 'h3', skill: 'humor', level: 'C1', point: 'literally', reveals: ['hazard'], seg: [179.3, 190.9],
      stem: 'Why does the narrator stress “literally” about getting into bed?',
      choices: ['There’s a trampoline built right into the bed', 'Carly is so tired that she falls straight into it',
                'The bed is so high she has to jump up to it'], a: 0,
      cue: '「jump into bed」のすぐあと、bed の「おまけ」。',
      line: 'you *literally* jump into bed. … this bed also comes with a *built-in trampoline*.',
      said: '「文字どおりベッドに飛び込む。トランポリン付き」と言う。',
      mean: 'jump into bed は普通「さっと寝る」のたとえ。それが本当のジャンプになる。',
      trap: 'hard day が前にあると疲れの話に聞こえる。literally は、たとえが本当になる合図。',
      use: 'I literally ran to the gate.（本当にゲートまで走ったよ）' },

    // why: a tip ← "for sure" heard as a lead-in to advice on a new toy; another feature ← the tour has listed
    //   feature after feature
    { id: 'r1', skill: 'predict', level: 'B2', point: 'hazard', reveals: ['literally'], seg: [187.65, 193.7],
      then: [193.7, 203.6],
      stem: 'After “one of the most unique additions”, what kind of remark comes next?',
      choices: ['A “but”, then a worry about its safety', 'A “so”, then a tip on how to use it',
                'An “and”, then another of its features'], a: 0,
      cue: 'for sure で何かをほめたあと、英語でよく続くもの。',
      line: 'For sure one of the most unique additions, *but it should come with a hazard warning*.',
      said: '「確かに一番ユニークな設備。でも危険の注意書きが要るね」と言う。',
      mean: 'for sure でほめてから but で注意を足す。直後の場面で、それが当たる。',
      trap: '紹介が続くので次の設備を予想しやすい。for sure の強いほめは but の前ぶれ。',
      use: 'It’s fun, but be careful.（楽しいけど、気をつけてね）' },

    // anchor: 209.76–218.46 s "admittedly… very hard to place your coffee onto" is followed by "but… actual water, it
    //   doesn't even matter": the one job of a coffee table fails, and he says it doesn't matter
    // R fix: V2 — "get used to it" was a filler; now a near miss that softens "very hard" and drops the shrug
    // R fix: V2 (C2, 2nd pass) — blind 55 %: "set them down with care" was the weakest; now right fact, wrong stance
    //   ("a real shame"), which "it doesn't even matter!" settles. Notes trimmed to ≤ 120
    // why: a shame ← "admittedly… very hard" heard as the verdict, the "but" missed; mostly works ← "very hard" heard
    //   as mild (it's understatement for "can't"), and "doesn't even matter" heard as "no big deal, it works"
    { id: 'c1', skill: 'infer', level: 'C2', point: 'coffee', seg: [206.1, 219.0],
      stem: 'Which plain-English version keeps what the narrator means about the table?',
      choices: ['“It fails as a coffee table, and that’s just fine by me.”', '“It fails as a coffee table, which is a real shame.”',
                '“It’s a bit awkward for coffee, but mostly it works.”'], a: 0,
      cue: '「very hard」と言った物と、そのあとの「but」の文。',
      line: '*admittedly*, this would be *very hard to place your coffee onto*, but… *it doesn’t even matter*!',
      said: 'コーヒーは置きにくいと認め、本物の水入りだから関係ない、と言う。',
      mean: 'very hard は「ほぼ無理」の控えめな言い方。台としてはだめでも、飾りとして最高。',
      trap: 'very hard を軽く、または嘆く文と取りやすい。but のあとで気にもしていない。',
      use: 'It’s useless, and I love it anyway.（役に立たないけど、それでも好き）' },

    // R fix: V2 — only the key had the admit-then-turn shape; all three now admit the flaw first
    // R fix: V2 (2nd pass) — blind 65 %: "happily" made the key the only upbeat one for an upbeat narrator, and
    //   "fixable" was weak; now a caution (from “admittedly”) and a wish, with no mood word on the key
    // why: ruins it ← "very hard to place your coffee onto" taken as the verdict; be careful ← "admittedly" read as
    //   the start of a warning
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'coffee', seg: [208.6, 219.0],
      stem: 'How does the narrator feel about the flaw in the water table?',
      choices: ['He admits it, then waves it away as nothing', 'He admits it, then says it ruins the piece',
                'He admits it, then warns people to be careful'], a: 0,
      cue: '「admittedly」の文と、そのあとの「but」の文。',
      line: '*admittedly*, this would be very hard to place your coffee onto, *but* it’s such a cool display…',
      said: '「確かにコーヒーは置きにくい。でもすごい飾りだ」と言う。',
      mean: 'admittedly で欠点を認め、but のあとで「それでもいい」と言う。',
      trap: '欠点の文が長く、結論に聞こえる。admittedly 〜 but は but の後が本音。',
      use: 'Admittedly, it’s pricey, but worth it.（確かに高いけど、その価値はある）' },

    // R fix: V2 — "doesn't ever matter" was unidiomatic, leaving two; adds "does it", the near sound of "doesn't"
    // R fix: V2/K4 (2nd pass) — blind 50 %: "it doesn't ever matter" was the one unidiomatic choice, so the test-wise
    //   reader dropped it and compared the rest; cut to three
    // why: didn't ← does/did differ only in the vowel, and the story so far is in the past; does it ← "doesn't"
    //   /dʌznt/ and "does it" /dʌzɪt/ differ by one sound
    { id: 's1', skill: 'sound', level: 'B2', point: 'evenmatter', reveals: ['coffee'], seg: [214.4, 219.0],
      stem: 'Fill the gap: “…actual water, ___”',
      choices: ['it doesn’t even matter', 'it didn’t even matter', 'does it even matter'], a: 0,
      cue: '「actual water」のあと、最初の短い語の母音。',
      line: 'actual water, *it doesn’t even matter*!',
      said: '「本物の水まで。関係ない！」と盛り上がる。',
      mean: 'doesn’t の /ʌ/ は短く暗い音。matter の t は弾んで「マラー」に近い。',
      trap: 'did は母音だけ、does it は最後の音だけが違う。n’t の「ン」が残るかを聞く。',
      use: 'Who cares? It doesn’t even matter.（いいよ、そんなの関係ない）' },

    // R fix: V2 — the key was the only wordplay reading; all three now read a word in the name
    // why: sandwich ← "sandwich" = squeezed between, and a loveseat is for two; sweet ← seat/sweet near sound, and it's
    //   a dessert
    { id: 'h4', skill: 'humor', level: 'C1', point: 'loveseat', seg: [218.95, 228.4],
      stem: 'What is the joke about the ice cream sandwich seat?',
      choices: ['The “love” in its name now means loving the snack',
                'The “sandwich” in its name means two people squeeze in',
                'The “seat” in its name sounds like “sweet”, as in dessert'], a: 0,
      cue: '「new meaning」のあとと、続く because。',
      line: 'puts a *whole new meaning* to the word *loveseat*, because *who doesn’t love* an ice cream sandwich?',
      said: '「loveseat に新しい意味。アイスサンドが嫌いな人いる？」と言う。',
      mean: 'loveseat ＝ 二人がけソファ。love を「アイス好き」に読みかえた。',
      trap: 'sandwich や seat にだじゃれを探しがち。種明かしは because のあと。',
      use: 'That gives new meaning to “early bird.”（「早起き」の新しい意味だね）', retired: true },

    // why: fire ← "blown away" heard as a callback to the room burning down; mirror ← the digital mirror comes just
    //   before, and blown up = 拡大
    { id: 'h5', skill: 'humor', level: 'C1', point: 'pun', seg: [254.9, 269.4],
      stem: 'What makes the narrator’s last comment on the makeup area a pun?',
      choices: ['The wall he’s praising blows air at people', 'The old room was blown away by the fire',
                'The mirror shows faces blown up in size'], a: 0,
      cue: '「makeup area」のあとの設備と、最後の二語。',
      line: 'the wall has *built-in hair dryer* tech. … forgive the pun here, but I’m *blown away*.',
      said: '壁にドライヤーが内蔵され、ボタンで風が出る。そこで「吹き飛ばされた」と言う。',
      mean: 'blown away ＝ すごく感動した。ドライヤーの風で「吹き飛ばされた」にもかけている。',
      trap: '火事や鏡と結びつけやすいが、pun と言ったら直前の設備を見る。',
      use: 'Honestly, I was blown away.（正直、圧倒されたよ）' },

    // R drop: c2 (V2/V3/V5) — blind 60 % after two rewrites: "forgive the pun" before a pun is the phrase's stock
    //   use, which a B2 listener knows, so it can't be C2; and it turns on h5's point. Never shipped, deleted. c3
    //   (80 s) replaces it as the bank's second C2 item.
  ]
};
