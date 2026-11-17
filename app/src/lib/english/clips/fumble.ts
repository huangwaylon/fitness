// REVIEW 2026-11-17: pass 9, fix 12, drop 0, new 0; ear checks 0
// REVIEW open: i3 is kept at 60 % blind: every other reading of "That is so great about the bonus" either implies
//   belief too (K1) or is a filler. A second cold read still put g1 at 70 % and h1 at 65 %, from Michael's persona.
// REVIEW open: the draw sim shows the known harder-mode c2p3 gap (nt1/nt2 share points with g2/g1). It was
//   there before this review, and the shared points are real.
// “Fumble! - The Office US” (the official The Office channel, BEST OF SEASON 2 - The Office US): three cuts. Michael
// "thinks it through" with Jim while tossing a football; an office football game (visual); then the main scene: Dwight
// asks Michael for one of his old speeches, Michael fakes a $1,000 bonus announcement to show that words don't matter,
// Dwight tries the same with an accident, no bonuses and a branch closing, and Michael's own lie comes back on him.
// Segments from the captions, words from whisper (2026-11-16). Untested: 0–33 s (the reply “Can we not?” is never
// assigned by name; stems don't name its speaker), 33–72 s (the football game: shouted names, visual), 76–93 s (a
// sexual "salesman/saleswoman" joke, left out on purpose), 132.5 s (who says “That is so great about the bonus”; i3's
// key doesn't depend on it), 140 s (“Deliver it up” / whisper “Delete it up”), 144 s (“Wallpaper's selling” / whisper
// “Wallpaper to the ceiling”), 146–147 s (whisper only), 162.6 s (“who's” / whisper “who was”), 165–184 s (the Brad
// Pitt and Jennifer Aniston jokes need world knowledge), 184.6 s (captions “He's kidding” / whisper “I was kidding”:
// p2 and nt1 key only on “Dwight was kidding…” onward), 198–219 s (whisper loops “Let's do it” over the outro).
// Michael is named at 191.7 s (“Michael. — You said…”) and Dwight at 185.3 s (“Dwight was kidding”).
// EAR CHECK: none: every key rests on words both sources agree on.
import type { Clip } from '../types.ts';

export const officeFumble: Clip = {
  id: 'fumble', video: 'IU5CQC5ScFE', title: 'Fumble! - The Office US', dur: 219, wpm: 136, band: 'slow',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %: the key was the only humor mechanism), S3 (the cue's "yes"/"no" were only in the key),
    //   S4 (17.3 s → 14.9 s). The distractors are now humor readings too.
    // R fix (11-17): V2 (60 % blind): "expects a no" was weak; a second-thoughts reading of the trailing "then…"
    //   replaces it.
    // why: changing his mind ← "yes or no… either way" heard as flip-flopping; talks himself out ← "if we ask
    //   corporate… then" trails off like second thoughts, but he never drops the idea
    { id: 'h1', skill: 'humor', level: 'C1', point: 'eitherway', seg: [0.2, 15.1],
      stem: 'Why is Michael’s “thinking it through” at the start funny?',
      choices: ['He states the obvious as if it were deep analysis', 'He keeps changing his mind from one line to the next',
                'He talks himself out of asking corporate at all'], a: 0,
      cue: '「corporate」のあと、続けて言う三つの文。',
      line: 'they are either gonna say *yes or no*. *Could go either way*. We don’t know…',
      said: '本社に頼んだら「イエスかノーか、どっちもあり得る、分からない」と真剣に言う。',
      mean: '当たり前のことを深い分析のように言うのがおかしい。中身のない「熟考」。',
      trap: 'yes や no が続くと、迷いや取りやめに聞こえやすい。新しい中身が一つでもあるかを聞く。',
      use: 'It could go either way.（どっちに転ぶか分からない）' },

    // R fix: V2 (blind 50 %), K1 (what "Can we not?" drops, the thinking or the asking, isn't settled; the key now
    //   names only the move, a suggestion to stop).
    // why: permission ← "can" read as 〜してもいい？; unable ← "not" heard as "we can't", a statement of fact
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'cannot', seg: [20.4, 25.1],
      stem: 'When Michael says they must think it through, what does the short reply do?',
      choices: ['It suggests they just stop doing this', 'It asks whether they’re allowed to do this',
                'It says that they’re unable to do this'], a: 0,
      cue: '熱弁のあとの短い返事と、それへの答え。',
      line: 'Because if they say no, — *Can we not?* — No, yes, *we have to*.',
      said: '「ノーと言われたら…」に「やめない？」と返され、彼は「いや、やるんだ」。',
      mean: 'Can we not? ＝ それ、やめにしない？ 何をやめるかは省かれた、軽い拒否。',
      trap: 'can を「してもいい？」と取ると許可の質問になる。not があれば「やめない？」。',
      use: 'Can we not talk about work tonight?（今夜は仕事の話、やめない？）' },

    // R fix: V2 (blind 75 %: "like a box" echoed the stem's "staying in his office"). New stem and choices.
    // why: noisy ← "I need to think" comes right after, heard as the office being too loud; away from staff ← he's
    //   outside with Jim, heard as wanting to be with people
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'cooped', seg: [24.4, 29.2],
      stem: 'What does Michael say is wrong with his office?',
      choices: ['It makes him feel shut in all day long', 'It’s too noisy for him to think in there',
                'It keeps him away from all his staff'],
      a: 0,
      cue: '「office」の直前の動詞句と、言いかえの一語。',
      line: 'I don’t like to be *cooped up* in that office, in that *box*, all day long.',
      said: '一日中あのオフィス、あの箱にこもるのは嫌だ、と言う。',
      mean: 'cooped up ＝ 狭い所に閉じこめられた。box と言いかえて窮屈さを強める。',
      trap: 'office から人や仕事の多さを思いやすい。知らない句は、直後の言いかえがヒント。',
      use: 'I’ve been cooped up inside all week.（一週間ずっと家にこもってた）' },

    // R fix: V2 (blind 55 %). The distractors now come from “remember the speeches that you gave”.
    // R fix (11-17): V2 (55 % blind): "tips" was a filler; a help-me-write request replaces it.
    // why: help writing ← "speeches" + a request, the usual "help me with my speech" script; hear again ← "remember the
    //   speeches" heard as wanting to hear one again
    { id: 'd1', skill: 'detail', level: 'B1', point: 'copy', seg: [93.4, 98.6],
      stem: 'In the speech scene, what does Dwight ask Michael for?',
      choices: ['A written copy of one of his speeches', 'Michael’s help writing a speech of his own',
                'A chance to hear one of them again'],
      a: 0,
      cue: '二つ目の質問、「Could I have」のあと。',
      line: 'Could I have *a copy of one of them*?',
      said: '以前のスピーチの一つの写しをもらえないかと頼む。',
      mean: 'copy ＝ 写し。人のスピーチをそのまま使いたいという頼み。',
      trap: 'speeches が耳に残ると「聞きたい」「手伝って」に流れやすい。have a copy of は「もらう」。',
      use: 'Could I get a copy of that?（それのコピー、もらえますか）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'both', seg: [94, 97.5],
      stem: 'Type Michael’s answer: “I do, ___.” (3 words)', answer: 'both of them',
      cue: '「remember」への短い答えのあと。',
      line: 'I do, *both of them*.',
      said: '「覚えてるよ、両方とも」と答える。',
      mean: 'both of them が「ボウサヴェム」と一続き。of は弱く、them の th もほぼ消える。',
      trap: 'of と them が弱く、both だけが残りやすい。代名詞の前の of はほぼ「ア」。',
      use: 'I’ll take both of them.（両方ください）' },

    // why: his memory ← "remember" taken as Michael's own (but he just said "I do, both of them"); write his own ←
    //   a refusal heard as the usual "do your own work" script
    // R fix: V2 (blind 60 %): "remember" is now in a distractor too, and the third is a real refusal reason.
    { id: 'i1', skill: 'infer', level: 'B2', point: 'remember', reveals: ['copy'], seg: [94, 99.5],
      stem: 'Why won’t Michael hand over one of his speeches?',
      choices: ['The audience would remember it', 'He doesn’t remember either one well',
                'He’d rather Dwight write his own'], a: 0,
      cue: '「No, no」のあと、文の主語が誰か。',
      line: 'No, no, *they would remember*.',
      said: '「だめだめ、みんな覚えてるから」と断る。',
      mean: 'they は前にスピーチを聞いた人たち。同じ話をすれば借り物だとばれる、という理由。',
      trap: 'remember だけ拾うと本人の記憶の話に聞こえる。主語の they が誰かで意味が決まる。',
      use: 'They’d remember me from last time.（前回のこと、覚えてるよ）' },

    // R fix: V2 (blind 50 %): "annoyed" was a weak filler; now "about to give in" (a softener read as yielding).
    // why: watch ← "look" read literally (見て), and "Watch this" follows soon after; give in ← a pause after "No, no"
    //   heard as the Japanese 「まあ…」 before yielding
    { id: 'm1', skill: 'marker', level: 'B2', point: 'look', reveals: ['remember', 'demo'], seg: [98.4, 106.3],
      stem: 'Right after his “No, no”, what does Michael’s one-word opener do?',
      choices: ['Turns from his refusal to his real point', 'Tells Dwight to watch what he does next',
                'Signals that he’s about to give in'], a: 0,
      cue: '断ったすぐあと、文頭の短い一語。',
      line: 'they would remember. *Look*, it doesn’t matter what you say…',
      said: '断ったあと「いいか、何を言うかは問題じゃない」と助言に移る。',
      mean: 'Look ＝「いいかい」。見る話ではなく、本題や助言を切り出す前置き。',
      trap: 'look を「見て」と文字通りに取りやすい。文頭で間を置く Look は、話を切りかえる合図。',
      use: 'Look, it’s not a big problem.（いい？大した問題じゃないよ）' },

    // R fix (11-17): V2 (70 % blind): "lift spirits" was easy to rule out; a prank reading (fake news, Dwight watching)
    //   replaces it.
    // why: real news ← "very great news from corporate" taken at face value; prank ← the news is fake and Dwight looks
    //   on, but "Watch this" follows "it doesn't matter what you say": a lesson, not a joke
    { id: 'g1', skill: 'gist', level: 'B2', point: 'demo', seg: [98.4, 133.9],
      stem: 'Why does Michael make his big announcement to the office?',
      choices: ['To show Dwight how to win people over', 'To pass on good news from corporate',
                'To prank the staff while Dwight watches'], a: 0,
      cue: '発表の前の「Watch this」と、発表のあとの一言。',
      line: 'it doesn’t matter what you say… Here we go. *Watch this*.',
      said: '「何を言うかは関係ない」と言い、「見てろ」と良い知らせを発表してみせる。',
      mean: '発表は実演。話題しだいで人は乗る、とドワイトに見せるため。',
      trap: 'from corporate で本当の知らせに聞こえる。前の Watch this が「お手本」の合図。',
      use: 'Watch this. I’ll show you how.（見てて。やり方を見せるよ）' },

    // R fix: S4 (20.2 s → 9 s, the advice alone settles it: "people care about" refutes both distractors), N6 (notes
    //   138 → ≤ 120).
    // anchor: 99.6–105 s “it doesn't matter what you say, it just matters that you're saying something that people
    //   care about”: the audience's interest, not the speaker's, and nothing about delivery
    // R fix (11-17): V2 (60 % blind, second rewrite): "sound confident" was off the words; the new near miss keeps the
    //   first half only.
    // why: from the heart ← "something that people care about" heard as what the speaker cares about (scope shift);
    //   whoever talks ← keeps "it doesn't matter what you say" and drops the "people care about" condition
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'demo', seg: [99.2, 108.2],
      stem: 'Which plain-English version keeps Michael’s advice to Dwight?',
      choices: ['“Say anything, as long as it’s what they want to hear.”',
                '“Talk about what you truly care about, and they’ll listen.”',
                '“Say anything at all; people listen to whoever talks.”'], a: 0,
      cue: '助言の後半、だれが気にすることか。',
      line: 'it *doesn’t matter what you say*, it just matters that you’re saying something that *people care about*.',
      said: '「何を言うかは関係ない、皆が気にすることを言っていればいい」と助言する。',
      mean: '矛盾して聞こえるが、中身は何でもよく、聞き手の関心に触れればいい。',
      trap: 'care about を自分の思いと取ると「心をこめて話せ」になる。主語の people を追う。',
      use: 'Just tell them what they want to hear.（相手が聞きたいことを言えばいい）', retired: true },

    // why: hundred ← "hundred" and "thousand" both end in a soft -nd; ten thousand ← "$1,000" heard after "all of
    //   you", as if it were a total
    { id: 'n1', skill: 'number', level: 'B1', point: 'amount', seg: [110.6, 119.6],
      stem: 'How big does Michael say each bonus will be?',
      choices: ['One hundred dollars', 'One thousand dollars', 'Ten thousand dollars'], a: 1, keep: true,
      cue: '「bonuses for」のすぐあと。',
      line: 'all of you are getting *bonuses for $1,000*.',
      said: '全員にボーナスが出る、と発表する。',
      mean: 'bonuses for $1,000 ＝ 1人1,000ドルのボーナス。',
      trap: 'hundred と thousand は語尾の「ンド」が似る。始まりの th の息の音で thousand と分かる。',
      use: 'It’s about a thousand dollars.（だいたい1,000ドルです）' },

    // R fix: V2 (blind 60 %: two negative feelings left the key as the only positive one).
    // R fix (11-17): V2 (60 % blind): "nervous" was easy to rule out; a surprise reading of "You see that?" replaces
    //   it.
    // why: amused ← he has just fooled everyone, so laughing at them is expected; surprised ← "You see that?" repeated
    //   heard as disbelief, but "I had them" is a boast
    { id: 't2', skill: 'attitude', level: 'B2', point: 'proud', reveals: ['had'], seg: [128, 132.4],
      stem: 'Right after the cheering, how does Michael sound talking to Dwight?',
      choices: ['Proud, wanting Dwight to notice his work', 'Amused, inviting Dwight to laugh at them',
                'Surprised, not expecting it to work so well'], a: 0,
      cue: '二度くり返す「You see」と、最後の一言。',
      line: 'You see how they *responded to me*? In that moment, *I had them*.',
      said: '「見たか？みんなの反応。あの瞬間、心をつかんでた」とドワイトに言う。',
      mean: 'You see? を重ねるのは手柄を見せたい気持ち。後ろめたさは言葉にない。',
      trap: 'だました直後なので笑いや驚きを想像しやすい。話の中心が「自分への反応」かで決める。',
      use: 'Did you see how they reacted?（みんなの反応、見た？）' },

    // R fix: V2 (blind 50 %): the choices are now the same shape and length.
    // R fix (11-17): V2 (60 % blind): "the money" was a filler; a literal "had them (there)" reading replaces it.
    // why: one room ← "had them" read literally, as having them all gathered; nervous ← "in that moment" heard as a
    //   tense moment
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'had', seg: [128, 132.4],
      stem: 'When Michael describes the moment after his announcement, what does he mean?',
      choices: ['The whole room was on his side', 'He had got them all into one room', 'He had them nervous for a second'],
      a: 0,
      cue: '「In that moment」のあとの短い3語。',
      line: 'In that moment, *I had them*.',
      said: '発表のあと「あの瞬間、みんなをつかんでいた」と言う。',
      mean: 'I had them ＝ 聞き手を完全に引きつけた。have を「思いのままにする」の意味で。',
      trap: 'have を文字通り「そろえた・集めた」と取りやすい。人が目的語なら「つかんだ」。',
      use: 'For a minute there, I had them.（一瞬、みんなの心をつかんだ）' },

    // why: saw through it ← an over-the-top "so great" heard as knowing; teasing ← the same line heard as sarcasm
    // R fix: V2 (blind 55 %): parallel, equal-length choices.
    { id: 'i3', skill: 'infer', level: 'B2', point: 'believed', seg: [129, 135.6],
      stem: 'When someone then mentions the bonus, what does it show?',
      choices: ['The speaker believed the announcement', 'The speaker knew it was a setup',
                'The speaker is mocking Michael’s speech'], a: 0,
      cue: 'ほめる一言と、それへの返事。',
      line: 'That is *so great about the bonus*. — *No, no, it’s not true*.',
      said: 'だれかが「ボーナスの件、すごくいいね」と言い、「いや、本当じゃない」と返される。',
      mean: 'そばの人まで本気にしていた。打ち消すのは相手が信じたから。',
      trap: 'so great を皮肉と取ると「見抜いていた」になる。すぐの打ち消しが手がかり。',
      use: 'Wait, that’s not true, is it?（え、それ本当じゃないよね？）' },

    // R fix: V2 (blind 55 %), K7 (the key was strictly longest). New near miss: caught out and embarrassed.
    // R fix (11-17): V2 (55 % blind): "means to set things right" was easy to rule out; an impatient reading of "No,
    //   no" replaces it.
    // why: embarrassed ← "No, no, it's not true" heard as flustered at being caught; annoyed ← the same "No, no" heard
    //   as impatience, but "They're a great audience" praises them
    { id: 't1', skill: 'attitude', level: 'C1', point: 'justtalk', reveals: ['believed', 'demo'], seg: [134, 141.9],
      stem: 'When Michael explains the bonus news, how does he seem to feel?',
      choices: ['Unbothered; it was only a demonstration', 'Embarrassed; he got caught in a lie',
                'Annoyed; they took him too literally'], a: 0,
      cue: '打ち消したすぐあとの、言い訳の短さ。',
      line: 'it’s not true. *I was just talking*. So, *just go out there and say anything*.',
      said: '「本当じゃない、ただしゃべっただけ」と言い、「何でもいいから言ってこい」と送り出す。',
      mean: 'just talking ＝ 中身のないおしゃべり。うそを悪いと思っていない軽さ。',
      trap: 'だましたら気まずいはず、と想像で補いやすい。謝る語が言葉にあるかを聞く。',
      use: 'Don’t worry, I was just talking.（気にしないで、ただ言ってみただけ）' },

    // R fix (11-17): V2 (70 % blind, partly from s1's stem, which reveals 'accident'): "a fire next door" was off the
    //   scene; a traffic-report reading replaces it.
    // why: storm ← "skidded off the road" suggests ice or rain; jam ← "84 West" and "several cars" sound like a traffic
    //   report, but "accident… injured"
    { id: 'd3', skill: 'detail', level: 'B1', point: 'accident', seg: [147.3, 161.4],
      stem: 'What is Dwight’s first piece of news?',
      choices: ['A bad car crash on the highway', 'A storm that has closed the roads', 'A big traffic jam on the highway'],
      a: 0,
      cue: '「May I have your attention」のあとの最初の知らせ。',
      line: 'an *accident* on 84 West. Cars have *skidded off the road*…',
      said: '車が道から滑り出し、けが人も出たと告げる。',
      mean: 'skid ＝ 滑る。様子を細かく並べ、本物のニュースらしくしている。',
      trap: 'skidded や cars から天気や渋滞を思いやすい。最初の名詞 accident で決める。',
      use: 'There was an accident on the highway.（高速で事故があったんだ）' },

    // R fix: V2 (blind 80 %: the key was the only twist). Two choices now start the same way.
    // R fix (11-17): V2 (60 % blind): "wins them over" was the odd one out; all three now start "It causes panic".
    // why: walk out ← "Are we out of jobs? — Yes." sounds like the end for the staff; Dwight fired ← Michael says "it
    //   was just horrible", heard as Dwight paying for it; "You said we were getting bonuses" settles it
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['kidding'], seg: [147.3, 198.9],
      stem: 'How does Dwight’s attempt at a speech turn out?',
      choices: ['It causes panic, and Michael gets called out', 'It causes panic, and the staff walk out',
                'It causes panic, and Dwight ends up fired'], a: 0,
      cue: '最後に名前を呼ばれるのはだれか。',
      line: 'Dwight was kidding… — *You said we were getting bonuses*.',
      said: 'ドワイトは悪い知らせを並べて場を混乱させ、最後は Michael が問いただされる。',
      mean: '「何を言ってもいい」をまねた結果、二人のうそがまとめて返ってくる。',
      trap: '「失業？」「はい」で、皆が出て行く話に聞こえやすい。最後にだれが責められるかで決まる。',
      use: 'Well, that backfired.（まあ、裏目に出たね）' },

    // why: There's ← "has been" squeezed into one beat; had ← has/had differ only in a weak final consonant; was ←
    //   "been" lost, leaving a simple past
    // R fix: B1 (its stem names the accident, d3's key: reveals 'accident').
    { id: 's1', skill: 'sound', level: 'B2', point: 'hasbeen', reveals: ['accident'], seg: [148.9, 152.7],
      stem: 'Fill the gap: “___ an accident on 84 West.”',
      choices: ['There’s', 'There has been', 'There had been', 'There was'], a: 1,
      cue: '「attention, please」のあと、文の最初の弱い音。',
      line: '*There has been* an accident on 84 West.',
      said: '「84号線西行きで事故がありました」と告げる。',
      mean: '今起きたことの報告の形。has も been も省かずに言っている。',
      trap: 'has と had は語尾が弱く似る。今の知らせなら has。been を落とすと was に聞こえる。',
      use: 'There’s been a change of plans.（予定が変わりました）' },

    // R fix: V2 (blind 55 %), K7 (key strictly longest), B1 (a choice names the crash: reveals 'accident').
    // why: used up ← "Also… no bonuses" right after the accident sounds like cause and effect; never real ←
    //   "no bonuses" heard as giving away Michael's fake
    // R fix (11-17): S4: the end moves from 173.2 to 173.5 s, so "unrelated" isn't clipped (captions 172.7 s).
    { id: 'h2', skill: 'humor', level: 'C1', point: 'unrelated', reveals: ['accident'], seg: [168.3, 173.5],
      stem: 'Why is Dwight’s answer about the bonuses funny?',
      choices: ['He says the two have nothing to do with each other', 'He says the crash has used up the bonus money',
                'He says the bonus was never real to begin with'], a: 0,
      cue: '「Why would this…」への、短い答え。',
      line: 'Also, there will be *no bonuses*. — Why would this affect our bonuses? — *They’re unrelated*.',
      said: '「それとボーナスはなし」と言い、「事故と関係ある？」に「関係ない」と答える。',
      mean: 'also は因果に聞こえるが、本人が無関係と認める。悪い話をただ並べている。',
      trap: '事故の直後なので原因と結果に聞こえやすい。also は「ついでに」で、理由ではない。',
      use: 'Totally unrelated, but I love your shoes.（全然関係ないけど、その靴いいね）' },

    // R fix: V2 (blind 60 %). The near misses now come from “out of jobs” and "closing".
    // R fix (11-17): V2 (50 % blind) and K1: "cut jobs" was half true (closing means jobs go); a closing-time reading
    //   replaces it.
    // why: early today ← "closing" heard as 閉店時間, a shop closing for the day; sold ← "closing" heard as closing a deal;
    //   "Are we out of jobs? — Yes." settles it
    { id: 'd2', skill: 'detail', level: 'B1', point: 'branch', seg: [176.1, 181.7],
      stem: 'What does Dwight say about the office at the end of his news?',
      choices: ['It is going to close down', 'It is closing early today', 'It is going to be sold'], a: 0,
      cue: '最後の「Also」のあとと、そのあとの質問への返事。',
      line: 'Also, this branch is *closing*. … Are we out of jobs? — *Yes*.',
      said: '「この支店は閉鎖」と言い、「失業？」に「はい」と答える。',
      mean: 'branch ＝ 支店。closing ＝ なくなる。Yes で失業も認める。',
      trap: 'closing だけ拾うと、今日の閉店に聞こえる。主語の this branch と Yes まで聞く。',
      use: 'Is the store closing early today?（今日はお店、早く閉まりますか）' },

    // why: sorry for Dwight ← a boss cleaning up after his staff, the usual script; sticking up ← "kidding" heard as
    //   excusing Dwight as just a joker
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'kidding', seg: [184.4, 190.9],
      stem: 'When Michael steps in after Dwight’s news, what is he doing?',
      choices: ['Making it all Dwight’s fault, not his', 'Saying sorry for Dwight, as his boss',
                'Sticking up for Dwight as a joker'], a: 0,
      cue: '「kidding」のあとに続く評価の言葉。',
      line: '*Dwight was kidding*, and *I don’t know why*, because it wasn’t funny and it was just horrible.',
      said: '「ドワイトは冗談を言った、なぜか分からない、ひどかった」とみんなに言う。',
      mean: '冗談の主をドワイトと名指しし、自分は無関係のように突き放す。',
      trap: '上司が部下の失敗をわびる場面に見えやすい。謝る語があるか、主語を聞く。',
      use: 'I had nothing to do with it.（私は関係ないよ）' },

    // R fix: V2 (blind 70 %): the choices are now the same shape. N6 (notes 137 → ≤ 120, and a broken character).
    // anchor: 185.3–189.9 s Michael calls Dwight's made-up news “not funny… just horrible”; 191.7–193.6 s “Michael. —
    //   Yeah. — You said we were getting bonuses.”: the staff turn the same charge on him, by name
    // R fix (11-17): V2 (55 % blind, second rewrite): "the staff" was easy to rule out; a near miss with the right
    //   target and the wrong lie replaces it.
    // why: Dwight ← "Dwight was kidding… just horrible" points the blame at him; Michael, blamed for Dwight's lie ←
    //   right target, wrong reason: "You said we were getting bonuses" is Michael's own lie
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'outcome', reveals: ['kidding'], seg: [184.4, 194.1],
      stem: 'In the exchange after Dwight’s news, who is the joke on?',
      choices: ['Michael, caught out by his own trick', 'Dwight, for taking the advice too far',
                'Michael, blamed for a lie that was Dwight’s'], a: 0,
      cue: '「horrible」のあと、名前を呼ばれてからの一言。',
      line: 'it wasn’t funny and it was *just horrible*. — Michael. — *You said we were getting bonuses*.',
      said: '「ひどい」とドワイトを責めた直後、名前を呼ばれ「ボーナスが出るって言ったよね」と返される。',
      mean: '責めた言葉が自分に返る。先にうそを流したのは Michael。',
      trap: '名指しされたドワイトが的に聞こえやすい。Michael でも、うそはドワイトのではない。You said を聞く。',
      use: 'Says the guy who did the same thing.（同じことした人が言う？）', retired: true },

  ]
};
