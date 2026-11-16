// “Leslie exposes her biggest red flag in front of Ben | Parks and Recreation” (the official Parks and Recreation
// channel, Season 4): at a model UN, Ben (Peru) tells Leslie (Denmark) he can't stay friends after their break-up, and
// she turns her hurt into a war on Peru, a lost vote and a "coalition of the willing".
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 239 s. Ben is never named in the audio;
// "Leslie" (37.2 s, 139.7 s, 163 s) and the content of his turns settle him. Untested on purpose: 0–3 s (no context),
// 9–15 s ("merged our treaty" is whisper only; the captions have "shower treaty"), 65.8 s ("Stop being obtuse": the
// speaker is unclear), 80.9 s ("my flags": backstory), 133.6 s ("nut up"), 157–159 s ("dirty underwear back"),
// 163.4–167 s (the beheading threat; the captions garble it), 178–182 s (who holds the microphone), 184–192 s (the
// captions drop "and stop them… aggression"), 197.2 s ("cry me a river", captioned "Crimea River"), 213–219 s (the
// captions have "Denmark is the authority", whisper "no longer recognizes the authority").
// EAR CHECK: 203.2 s nt3 — “Oh, that's interesting” is mock surprise (gloating), not puzzlement; the same voice
//   ends on “Bam!” (209.6 s) in both sources
// REVIEW 2026-11-16: pass 2, fix 21, drop 1, new 1; ear checks 1 (unchanged)
// R drop: i1 (whom in Peru to destroy). With Ben in the title, “Ben” was guessable at heart (V2), and nt1/nt2 already
//   carry the point. Never shipped, so deleted; i3 (the microphone reply) replaces it
// Open: a1’s segment runs 15.6 s; it needs both “I understand…” (68.5 s) and “…be friends” (82.7 s)
import type { Clip } from '../types.ts';

export const leslieRedFlag: Clip = {
  id: 'modelun', video: 'NJlRjN77LGo', title: 'Leslie exposes her biggest red flag in front of Ben', dur: 260,
  wpm: 163, band: 'mid', tags: ['恋愛', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 65 %, right): the old distractors (a botched try, never been there) were weak; both now take the
    //   second “I’m back” as real Danish
    // why: sounds like “back” ← “I’m back” is heard twice, so Danish is taken as close to English; other meaning ←
    //   a foreign phrase is expected, so the repeat is heard as a Danish word with a twist
    { id: 'h1', skill: 'humor', level: 'C1', point: 'denmark', seg: [2.4, 7.4],
      stem: 'Why does Leslie’s line about how they say it in Denmark get a laugh?',
      choices: ['Her “Danish” is just the same English words', 'She uses a Danish word that sounds like “back”',
                'Her Danish phrase means something else in English'], a: 0,
      cue: 'Denmark のあとの言葉と、その次の一文。',
      line: 'I’m back. Or as they say in Denmark, *“I’m back.”* Most people speak English.',
      said: '「ただいま。デンマーク風に言うと『ただいま』。みんな英語を話すから」。',
      mean: '外国語の決まり文句を期待させて、同じ英語をくり返す肩すかしの笑い。',
      trap: 'デンマーク語を期待し、似た語や別の意味を探しやすい。as they say in ～ は肩すかしに注意。',
      use: 'Or, as they say in Paris, “bonjour.”（パリ風に言えば「ボンジュール」）' },

    // R fix: V2 (blind 60 %, right): the key was the only “without her”; Russia/China “refused any treaty” was an absolute.
    //   All three are now “Her partner…”. S4: the segment now starts at “I got cut out” (it ran 15.2 s)
    // why: finished ← “polish off this treaty” was her plan, heard as what happened; gave up ← “sick of treading
    //   water” heard as quitting
    { id: 'd1', skill: 'detail', level: 'B1', point: 'treaty', seg: [14.9, 22.8],
      stem: 'What happened to Leslie’s treaty while she was away?',
      choices: ['Her partner made a deal elsewhere and left her out', 'Her partner finished it early and signed for both',
                'Her partner gave up on it and stopped negotiating'], a: 0,
      cue: '「my own treaty」と、相手の返事の最後。',
      line: 'I got *cut out of my own treaty*? — …so I swam over to Asia, *made a deal*.',
      said: '条約から外されたと驚くレスリーに、相手は「アジアと話をまとめた」と答える。',
      mean: 'cut out of ～ ＝ ～から外される。留守の間に、彼女抜きで話が進んだ。',
      trap: 'polish off（仕上げる）は彼女の予定で、起きたことではない。主語で確かめる。',
      use: 'I got cut out of the group chat.（グループチャットから外された）' },

    // R fix: V2 (blind 55 %, right): the key was the only “contrast” mechanism; now all three are “UN-style words, then…”
    // why: food plea ← “Denmark needs…” heard as a nation in need (a food crisis comes up later); meeting place ←
    //   “by the refreshment table” is said, so the venue is taken as the joke
    { id: 'h2', skill: 'humor', level: 'C1', point: 'juice', seg: [22.8, 31.9],
      stem: 'Why does Denmark’s request for a summit with Peru get a laugh?',
      choices: ['UN-style words, then a reason a child would give', 'UN-style words, then a plea for food for her nation',
                'UN-style words, then a meeting place by the snacks'], a: 0,
      cue: 'because のあと、理由の中身と言い方の差。',
      line: 'Denmark would like to formally request a summit… because the nation of Denmark *needs a juice box*.',
      said: '「デンマーク国はペルー国との首脳会談を正式に求めます。ジュースが要るので」。',
      mean: '国連風のかたい言い回しで始め、理由は子どものおやつ。格調と中身の落差。',
      trap: 'table や needs から場所や食糧と取りやすい。かたい言葉の最後の、小さな理由で笑う。',
      use: 'I formally request a coffee break.（コーヒー休憩を正式に要求します）' },

    // R fix: V2 (blind 75 %, right): the key was the only personal choice; both distractors are now about the break-up too
    // why: back together ← “in a romantic way” heard as wanting the romance back; blame ← “selfish” and “obtuse”
    //   heard as a fight over who ended it
    { id: 'g1', skill: 'gist', level: 'B2', point: 'conflict', reveals: ['friends', 'agreed'], seg: [38.2, 67.2],
      stem: 'What are Leslie and Ben really at odds about?',
      choices: ['Whether they can still be friends after the break-up', 'Whether they should get back together as a couple',
                'Which of them is to blame for the break-up'], a: 0,
      cue: '「the other night」の前後、二人の本題。',
      line: 'I thought I could handle *being friends with you*, but I can’t…',
      said: 'ベンは「友だちは無理」と言い、レスリーは「恋人でなく友だちならいい」と返す。',
      mean: '国の代表ごっこは表向き。争点は、別れたあとも友だちでいられるか。',
      trap: 'romantic や selfish から復縁や責任の話と取りやすい。何を言い合うかを動詞で追う。',
      use: 'Can we still be friends?（友だちのままでいられる？）' },

    // R fix: V2 (blind 70 %, right): with Ben in the title and g1 beside it, “stay friends” was the only relationship choice; the
    //   distractors now come from the moment (he cuts her off; they work side by side)
    // why: talk now ← “Leslie, just… look” heard as “not now”; working beside her ← they’re at the same conference,
    //   and “handle” sounds like coping at work
    { id: 'd2', skill: 'detail', level: 'B1', point: 'friends', seg: [38.2, 44.6],
      stem: 'When Ben stops Leslie, what does he say he can’t do?',
      choices: ['Stay friends with her', 'Talk about it right now',
                'Keep working beside her'], a: 0,
      cue: '「I thought I could」のあと、but で変わる。',
      line: 'I thought I could handle *being friends with you*, but *I can’t*, okay?',
      said: '「君と友だちでいられると思ったけど、無理なんだ」と言う。',
      mean: '別れたあとも友だちでいる形が、ベンにはつらすぎる。',
      trap: 'can’t の t は弱く、can に聞こえやすい。I thought I could … but のあとは逆の内容。',
      use: 'I thought I could, but I can’t.（できると思ったけど、無理だ）' },

    // R fix: V2 (blind 75 %, right): “keep dating, but never at work” was a filler; it’s now a break until after the
    //   conference. S3: the cue’s “but” was a word only the key had
    // why: no contact at all ← Ben’s view, and the first half “we can’t spend time together” alone; a break ← “the
    //   right call” heard as a pause before deciding
    { id: 'd3', skill: 'detail', level: 'B2', point: 'agreed', reveals: ['friends'], seg: [44.4, 55.0],
      stem: 'According to Leslie, what did they agree on the other night?',
      choices: ['To stop dating, but still hang out as friends', 'To stop seeing each other at all, even as friends',
                'To take a break and talk again after the conference'], a: 0,
      cue: '「the right call」のあと、続けて足すこと。',
      line: 'we agreed… that we *can’t spend time together*… But that was *in a romantic way*.',
      said: '「一緒に過ごさないと決めたのは正しい。でもそれは恋人としての話。友だちなら平気」。',
      mean: '約束を「恋人として会わない」だけと解釈し、友だちづきあいは別だと言う。',
      trap: '前半だけ聞くと全面禁止に聞こえる。but のあとで範囲をしぼっている。',
      use: 'I meant that in a friendly way.（友だちとして言っただけ）' },

    // R fix: V2 (blind 80 %, right): the money and fair-share readings were far from “select”; both now are buffet readings
    //   a listener could bring to a relationship
    // why: others ← a buffet as “playing the field” in dating talk; coming back for more ← a buffet’s “seconds”,
    //   heard as her not letting go
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'buffet', seg: [54.4, 62.1],
      stem: 'What is Ben’s point when he brings up a buffet?',
      choices: ['She can’t keep only the parts she likes', 'She can’t date him and others at once',
                'She can’t keep coming back for more'], a: 0,
      cue: 'buffet の直前、何をどう選ぶと言うか。',
      line: 'You can’t just chop up the aspects of a relationship… and *select the ones you want* like a buffet.',
      said: '「関係を切り分けて、好きな部分だけ選ぶことはできない。ビュッフェみたいに」。',
      mean: '恋人の部分はやめて友だちの部分だけ残す、という選び方への批判。',
      trap: 'ビュッフェから「ほかの人とも」「おかわり」と考えやすい。比喩は直前の select とセットで聞く。',
      use: 'You can’t just pick and choose.（いいとこ取りはできないよ）' },

    // R fix: V2 (blind 70 %, right): “says where Ben comes from” was absurd; it’s now an apology reading
    // why: accepts ← “I understand” read as consent (わかりました ＝ 了承); at fault ← understanding read as an
    //   apology (日本語の「わかります、すみません」)
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'coming', reveals: ['unfair'], seg: [68.0, 72.8],
      stem: 'In her comment to the camera, what does Leslie’s opening clause do?',
      choices: ['Grants his view before her complaint', 'Accepts his decision and moves on',
                'Admits she was partly at fault'], a: 0,
      cue: '最初の一文と、すぐあとの but。',
      line: 'I *understand where he’s coming from*, *but* I have been nothing but straightforward with him',
      said: '「彼の言い分はわかる。でも私はずっと正直だった」と話す。',
      mean: 'coming from ＝ 相手の考えの出どころ。認めてから but で本音へ。',
      trap: 'understand を了承や謝罪と取りやすい。but の前の「わかる」は反論の前置きになりやすい。',
      use: 'I see where you’re coming from, but…（言いたいことはわかるけど…）' },

    // R fix: V2 (blind 70 %, right): the key was the only complaint; the distractors now each half-fit her words
    // why: fair ← her own “that was the right call” earlier, and “suddenly” heard as “too late”; own fault ←
    //   “shared my flags” heard as oversharing she regrets
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'unfair', reveals: ['coming', 'friends'], seg: [68.0, 83.6],
      stem: 'Going by her whole comment, how does Leslie see Ben’s decision?',
      choices: ['Unfair, since she has tried hard and been open', 'Fair, though she wishes he had told her sooner',
                'Hurtful, but her own fault for sharing too much'], a: 0,
      cue: '「It’s just」のあと、自分がしてきたことの列挙。',
      line: 'I’ve *made an effort*, and I’ve shared my flags with him, and *suddenly* he doesn’t want to be friends?',
      said: '「努力したし、自分の弱点も見せたのに、急に友だちはやめたいなんて」と言う。',
      mean: '前置きで理解を示しても、本音は「ここまでしたのに不公平」という不満。',
      trap: '冒頭の I understand に引っぱられやすい。and で行動を重ねたら不満の前ぶれ。',
      use: 'I’ve done everything right, and suddenly this?（ちゃんとやってきたのに、急にこれ？）' },

    // R fix: V2 (blind 70 %, right): the stem’s “After her comment to the camera” pointed at the key, and “dressed up as” was
    //   the only knowing choice; the scripted-twist filler is now a Peru-in-the-game reading
    // why: partner’s deal ← it really was a betrayal, just before (“cut out of my own treaty”); inside the game ←
    //   war is declared on Peru, so a wrong done by Peru in the game is the natural guess
    // anchor: 77.1–85.6 s to camera, "suddenly he doesn't want to be friends… that leaves me with only one option",
    //   then 89.3–98.3 s "due to a recent betrayal… declare war on Peru" (Peru is Ben's country, not the partner's)
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'motive', reveals: ['friends', 'option'], seg: [76.6, 98.9],
      stem: 'How should we hear Leslie’s “recent betrayal”?',
      choices: ['As Ben’s refusal to stay friends, put in political words', 'As her partner’s deal with Asia, which cut her out',
                'As Peru breaking a deal with Denmark inside the game'], a: 0,
      cue: 'カメラへの一言の最後と、直後の宣言をつなげて。',
      line: 'suddenly he *doesn’t want to be friends*?… That leaves me with *only one option*. … Due to *a recent betrayal*…',
      said: 'カメラに「急に友だちをやめたいなんて。道はひとつ」と話し、直後にペルーへ宣戦布告する。',
      mean: 'カメラへの本音が宣言の意味を決める。裏切りとはベンの決断で、私情を国際問題の言葉で包んでいる。',
      trap: '条約の件も裏切りに聞こえるが、相手はペルーではない。カメラへの一言が答え合わせ。',
      use: 'You know what? This means war.（よし、こうなったら受けて立つ）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'option', seg: [83.6, 86.5],
      stem: 'Type what Leslie says: “That ___ only one option.” (3 words)', answer: 'leaves me with',
      cue: '「you know what」のあと、That に続く3語。',
      line: 'Well, you know what? That *leaves me with* only one option.',
      said: '「じゃあ、残る道はひとつね」と言って、その場を離れる。',
      mean: 'leave A with B ＝ AにBが残る。「リーヴズミウィズ」とつながる。',
      trap: 'me が弱く抜けやすい。語数を数えて足りない語を探す。',
      use: 'That leaves us with one choice.（となると、選択肢はひとつだ）' },

    // R fix: K1. “I lost my treaty” could be defended (the treaty was a real sudden change for her); it’s now
    //   the scripted twist that her own “I’m like, what? Hold up” refutes
    // why: adapt ← her answer heard as a sincere lesson for the student who “didn’t prepare”; planned ← “are you
    //   changing the scenario?” heard as a teaching move she meant to make
    // anchor: 114.5–123.8 s the "global politics" frame slides into "I thought this one thing… and I'm like, what?
    //   Hold up" (first person, her own shock), right after "specifically one person who lives there" (109–111 s)
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'scenario', reveals: ['motive'], seg: [105.9, 124.6],
      stem: 'Which plain-English version keeps what Leslie means in her answer about scenarios?',
      choices: ['“Things changed for me suddenly, so the game changes too.”', '“Real politics shifts fast, so you should learn to adapt.”',
                '“I planned this twist all along, to test all of you.”'], a: 0,
      cue: '「global politics」から、話し方がどう変わるか。',
      line: 'Global politics can change… and *suddenly* you’re just like, wait, *I thought this one thing*… and *I’m like, what?*',
      said: '「シナリオを変えたの？」に、「国際情勢は変わる。急に『え？』ってなる」と答える。',
      mean: '一般論のはずが、I thought, I’m like と自分の体験の語り方になる。ベンの件の動揺そのもの。',
      trap: '先生の教訓に聞こえやすい。一般論の途中で主語が I に変わったら本人の話。',
      use: 'Things change, and suddenly you’re like, what?（状況が変わって、急に「え？」ってなる）' },

    // R fix: V2 (blind 55 %, right): “Who has thanks for me?” isn’t real English (§9.5), so it fell out blind; it’s now “tags”
    //   (name tags fit a conference)
    // why: tasks ← the k and s blur after “has”, and tasks fit a meeting; tags ← name tags fit a conference, and the
    //   nasal before k is easy to miss
    { id: 's1', skill: 'sound', level: 'B2', point: 'tanks', seg: [124.8, 127.8],
      stem: 'Fill the gap: “Who has ___ for me?”',
      choices: ['tanks', 'tasks',
                'tags'], a: 0,
      cue: '語の真ん中と最後の子音。',
      line: '*Who has tanks* for me?',
      said: '戦争を始めたレスリーが「戦車を出せる国は？」と呼びかける。',
      mean: 'tank ＝ 戦車。a のあとに鼻にかかる n が入り、最後は ks。',
      trap: '会議の場なので tasks や tags に引っぱられやすい。a のあとの鼻音 n と語末の ks を聞く。',
      use: 'Who has a charger for me?（充電器、貸してくれる人いる？）' },

    // R fix: V2 (blind 55 %, right): the stem’s “rhyming” pointed at the X-schmX pattern; it’s gone, and “come back later” is now
    //   “until the war is over”
    // why: put off ← “This is war” heard as “war first, food later”; mocking ← the “schm-” echo heard as mimicking the
    //   delegate
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'schmood', seg: [124.8, 132.5],
      stem: 'When a delegate brings up the food crisis, what does Leslie’s reply do?',
      choices: ['Brushes the topic aside as not worth her time', 'Puts the topic off until the war is over',
                'Mocks the delegate for how it was said'], a: 0,
      cue: 'food のくり返しと、直後の一文。',
      line: 'we’re gonna keep trying to solve a food crisis. — *Food, schmood.* This is war.',
      said: '「食糧危機の話を続けます」に、「食糧なんかどうでもいい。これは戦争」と返す。',
      mean: '語頭を schm に替えてくり返すと「～なんてどうでもいい」。話題を払いのける型。',
      trap: 'まねやからかいと取りやすい。schm- は相手でなく話題そのものを軽く扱う。',
      use: 'Diet, schmiet. Pass the cake.（ダイエットなんかいいから、ケーキ取って）' },

    // R fix: V2 (blind 50 %, right): the guest and peacemaker readings were far off; a friendly tease is the real near miss.
    //   The stem’s “walks over” was visual
    // why: friend ← “well, well, well” and “look who” can open a friendly tease; envoy ← it’s a model UN, and
    //   “brave” heard as respect for a diplomat
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'wellwell', seg: [134.3, 138.7],
      stem: 'When someone shows up in “Europe”, how is he greeted?',
      choices: ['As an enemy, with a mock-tough taunt', 'As a friend, with a playful tease',
                'As an envoy, with a stiff formal welcome'], a: 0,
      cue: '最初の三語と、show his face という言い方。',
      line: '*Well, well, well.* Look who is *brave enough to show his face* in Europe.',
      said: '「おやおや、よく顔を出せたもんだ」と迎える。',
      mean: 'Well, well, well は悪役の決まり文句。show his face ＝ よく顔を出せたな。',
      trap: 'brave をほめ言葉と取りやすい。brave enough to は皮肉にもなる。',
      use: 'Look who decided to show up.（やっと来たか、誰かさん）' },

    // R fix: N7. “Send his tanks” gave away s1’s answer; the distractor is now “allies” (a near sound to lions)
    // why: allies ← a near sound (lions / allies), and allies fit a war; guard ← “army” heard but the animal missed,
    //   and guarding is the safer reading
    { id: 'd4', skill: 'detail', level: 'B1', point: 'lions', seg: [138.6, 142.5],
      stem: 'What does one delegate offer to do for Leslie?',
      choices: ['Send his army of lions after them', 'Send his army of allies after them',
                'Send his army to guard Denmark'], a: 0,
      cue: '「Say the word」のあと、army of の次の語。',
      line: 'Say the word, Leslie… my *army of lions* on ’em.',
      said: '「レスリー、一言くれればライオン軍団をけしかけるよ」と申し出る。',
      mean: 'Say the word ＝ 合図さえくれればすぐやる。協力を申し出る決まり文句。',
      trap: 'lions と allies は音が近い。army で止めず、何の軍団かまで聞く。',
      use: 'Say the word, and I’ll be there.（一言くれれば、すぐ行くよ）' },

    // R fix: V2 (blind 55 %, right): the key was the only twist; now all three turn the blame somewhere
    // why: the students ← “you” heard as plural, the crowd that’s out of control; her own fault ← “I agree” read as
    //   owning up (日本語の「そうですね、私のせいで」)
    { id: 'h3', skill: 'humor', level: 'C1', point: 'agree', seg: [142.4, 150.2],
      stem: 'When Ben says things are getting out of control, why is Leslie’s reply funny?',
      choices: ['She agrees, then says it’s all his fault', 'She agrees, then blames the students for it',
                'She agrees, then says she’s the one to blame'], a: 0,
      cue: '「I agree」の直後、話がどちらへ向かうか。',
      line: 'things are starting to get a little out of control here. — *I agree. You betrayed me*…',
      said: '「収拾がつかない」に、「同感。あなたが裏切ったんだから償って」と返す。',
      mean: '同意で始めて、話を相手への非難にひっくり返す。止めに入った人が責められる。',
      trap: 'I agree で話がまとまると思いやすい。直後に you で始まる文が来たら矛先は相手。',
      use: 'I agree. And it’s your fault.（同感。で、あなたのせいね）' },

    // R fix: V2 (blind 75 %, right): both distractors were meek; one is now the trap the moment sets (Ben’s “I need to, I need to”
    //   does sound like a stammer)
    // why: mocking ← Ben’s “I need to, I need to” sounds like a stammer, so “stutter” is taken as about his echo;
    //   unclear ← the question form heard as an offer to repeat
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'stutter', seg: [150.2, 153.6],
      stem: 'When Ben repeats her demand back to her, what does Leslie’s short question mean?',
      choices: ['You heard me; I meant it', 'Are you mocking how I talk?',
                'Was I unclear? I’ll repeat it'], a: 0,
      cue: 'ベンのくり返しの直後、短い質問。',
      line: 'I need to… I need to pay? — *Do I stutter?*',
      said: '「僕が償う？」と聞き返すベンに、「私、どもった？」と返す。',
      mean: 'Do I stutter? ＝ はっきり言ったでしょ。聞き返しを突っぱねる決まり文句。',
      trap: '話し方の確認と取りやすい。聞き返しへの Do I ～? は、確認でなく念押し。',
      use: 'You heard me. Clean your room.（聞こえたでしょ。部屋を片づけなさい）' },

    // R fix: V2 (blind 65 %, right): the truce choice was weak; it’s now the break-up hand-back that “dirty underwear back” suggests
    // why: he gives up ← “Oh, okay. Fair enough” just before, and whoever holds a white flag usually surrenders;
    //   returning ← “dirty underwear back” heard as a break-up hand-back of her things
    { id: 'i2', skill: 'infer', level: 'B2', point: 'flag', seg: [153.2, 163.6],
      stem: 'When Ben offers Leslie something to “borrow”, what is his message?',
      choices: ['She’s the one who should surrender', 'He’s the one ready to surrender',
                'He’s returning something she left'], a: 0,
      cue: '「white flag」のあと、誰が振るのか。',
      line: 'it’s a white flag, and *you may as well start waving it* right now, Leslie.',
      said: '「白旗だよ。今すぐ振り始めたほうがいい、レスリー」と言う。',
      mean: '降参すべきはレスリーだという挑発。fair enough も引き下がりではない。',
      trap: '白旗を持つ側が降参と考えやすい。you may as well ～ の you が誰かで決まる。',
      use: 'You may as well give up now.（もうあきらめたほうがいいよ）' },

    // R new: replaces i1 (dropped) so non-C2 infer stays at 2. Fresh blind read ~40 %: B is the literal question, C
    //   the polite give-in; both are refuted by "Oh, really?" plus the "Then why…?" form
    // why: not sure why ← the question heard as a real one (日本語の「なんでだろう」); give it back ← “Oh, really?” heard as
    //   giving in, the polite next step
    { id: 'i3', skill: 'infer', level: 'C1', point: 'mic', seg: [175.0, 183.5],
      stem: 'When a cut-off speaker says “I’m not finished”, what does the reply mean?',
      choices: ['“You’re done: it’s my turn to speak now.”', '“I’m not sure why they gave this to me.”',
                '“Fine, I’ll give it back once you’re done.”'], a: 0,
      cue: '「I’m not finished」への返事の形。',
      line: 'Excuse me, Madam Ambassador… I’m not finished. — Oh, really? *Then why do I have the microphone?*',
      said: '「まだ終わってない」に、「へえ、じゃあなぜマイクは私に？」と返す。',
      mean: '答えを求めない反語。マイクを持つ私に発言権があり、あなたの番は終わり。',
      trap: 'Oh, really? を納得の相づちと取りやすい。Then why ～? は反論の形になりやすい。',
      use: 'Really? Then why is it on my desk?（へえ、じゃあなんで私の机にあるの？）' },

    // R fix: V2 (blind 60 %, right): “cleared by the vote” was refuted by the line itself; all three are now condemned, and differ
    //   in what she does next
    // why: leaving ← “no longer recognizes the authority” heard as walking out; peace ← “Together we stand” heard as
    //   reconciliation
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['colors'], seg: [183.6, 231.5],
      stem: 'By the end of the vote, where does Leslie stand?',
      choices: ['Condemned by the vote, but not backing down', 'Condemned by the vote, and leaving the talks',
                'Condemned by the vote, and ready to make peace'], a: 0,
      cue: '投票結果の一文と、そのあとの呼びかけ。',
      line: '*Denmark is formally condemned.* … who is ready to join *the coalition of the willing*?',
      said: '決議が可決され、デンマークは非難される。レスリーは「同盟に加わる者は？」と呼びかける。',
      mean: '負けても引かず、仲間を集めて戦いを続ける、という結末。',
      trap: 'together を和解、authority を退場と取りやすい。最後の呼びかけまで聞く。',
      use: 'Who’s with me?（一緒にやる人いる？）' },

    // why: barely ← the drama of the moment heard as a close call; long debate ← "flying colors" heard as a
    //   colourful, lively argument
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'colors', reveals: ['outcome'], seg: [202.2, 210.6],
      stem: 'When the result is read out, how does the resolution pass?',
      choices: ['Easily, with a big majority', 'Barely, by just a single vote', 'Only after a long debate'], a: 0,
      cue: 'passes のあとの決まった言い方。',
      line: 'The resolution passes *with flying colors*.',
      said: '「決議は大差で可決」と読み上げる。',
      mean: 'with flying colors ＝ 楽々と。試験に余裕で受かるときにも使う。',
      trap: 'colors から「にぎやかな議論」を想像しやすい。ひとかたまりで覚える。',
      use: 'She passed the test with flying colors.（彼女は試験に楽々合格した）' },

    // R fix: V2 (blind 50 %, right): “polite interest” was weak; it’s now a cushion before bad news (a Japanese frame)
    // why: real surprise ← “Oh” and “interesting” taken at face value; soft lead-in ← “interesting” read as a polite
    //   cushion before bad news (日本語の「ちょっと意外な結果ですが」)
    // anchor: 203.2–209.6 s the same voice goes straight on to "passes with flying colors… Denmark is formally
    //   condemned. Bam!": a cheer, not puzzlement
    // retired: g2 reveals its point (colors), so play 3+ under g2 drew no C2
    { id: 'nt3', skill: 'attitude', level: 'C2', point: 'colors', reveals: ['outcome'], seg: [202.2, 210.6], retired: true,
      stem: 'When the result is read out, how does “Oh, that’s interesting” land?',
      choices: ['As mock surprise from someone who wanted this', 'As real surprise that so many voted yes',
                'As a soft lead-in to bad news for Leslie'], a: 0,
      cue: '最後の一語まで聞いてから、最初の一言を。',
      line: '*Oh, that’s interesting.* The resolution passes with flying colors… *Bam!*',
      said: '「おや、興味深い」と言い、「大差で可決、デンマークは非難された。バン！」と続ける。',
      mean: '驚いたふりの前置き。最後の Bam! で、望みどおりの結果を喜んでいたとわかる。とぼけた勝ち誇り。',
      trap: 'interesting を言葉どおりの驚きや関心と取りやすい。前置きの意味は、あとの一言で決まる。',
      use: 'Oh, would you look at that. I win.（おや、見てよ。私の勝ち）' },

    // R fix: V2 (blind 55 %, right): “embarrassed” was far off; it’s now “freaking” heard as a complaint
    // why: let down ← “freaking moon” heard as a complaint (freaking as an angry intensifier); annoyed ← the moon offer
    //   heard as a student mocking her
    { id: 'a4', skill: 'attitude', level: 'B1', point: 'moon', seg: [232.3, 239.4],
      stem: 'How does Leslie react when the moon joins her coalition?',
      choices: ['Thrilled, as if it’s a real win', 'Let down that only the moon joined',
                'Annoyed that it isn’t taken seriously'], a: 0,
      cue: '最初の一語の勢いと、そのあとの挑発。',
      line: '*Yeah! We got the freaking moon.* What are you gonna do without tides, Peru?',
      said: '月が加わると「やった！月を味方にした。潮がなくなったらどうする、ペルー？」と叫ぶ。',
      mean: '冗談の参加を本気で喜び、ペルーを脅す。本気の熱中ぶりが笑いどころ。',
      trap: 'freaking を不満の強調と取りやすい。Yeah! とペルーへの挑発で気持ちがわかる。',
      use: 'Yes! We got the tickets!（やった！チケット取れた！）' },
  ]
};
