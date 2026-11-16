// “Dwight Fights Himself - The Office US” (the official The Office channel, BEST OF SEASON 6 - The Office US): at his
// yearly karate seminar Dwight pitches the throat punch with a Yakuza story; Kevin refuses to be his partner, a coworker
// says Dwight's only worthy opponent is himself, and Dwight demonstrates on himself while the coworker cheers him on.
// Segments from the captions, words from whisper (2026-11-16). Only Dwight, Kevin and Jim are named; everyone else is
// "a coworker", and no item depends on which coworker speaks.
// Untested on purpose: 0–9 s (shouted moves), 88–111 s (the fight itself: shouts and visual; whisper "In step!",
// captions "INSTEP"), 122–147 s (screams; whisper invents "Thank you" at 142 s).
// No ear checks: every key rests on words both sources agree on.
// REVIEW 2026-11-16: pass 6, fix 16, drop 1, new 0; ear checks 0
// OPEN: c1's segment is 25.4 s, a hair over the 25 s C2 talking-head limit; no clean cut keeps both "Because" and
//   "PUNCH" with 0.5 s margins.
import type { Clip } from '../types.ts';

export const dwightHimself: Clip = {
  id: 'dwighthimsf', video: '4HJ_10PQSLU', title: 'Dwight Fights Himself  - The Office US', dur: 147, wpm: 147,
  band: 'slow', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2, the key was the only choice about anything new; "new moves he made up" now shares that frame
    // why: his own moves ← "newest developments" heard as Dwight's own inventions; last year's moves ← "once a year"
    //   heard as a yearly review
    { id: 'g1', skill: 'gist', level: 'B1', point: 'seminar', seg: [8.6, 23.6],
      stem: 'According to the comment to camera, what is Dwight’s seminar for?',
      choices: ['To bring everyone up to date on karate', 'To try out new moves he came up with',
                'To go over the moves from last year’s class'], a: 0,
      cue: '最初の文、「holds a seminar」のあと。',
      line: 'Once a year, Dwight holds a seminar *updating us on the newest developments* in the world of karate.',
      said: '年に一度、ドワイトが空手の最新情報を伝えるセミナーを開く、とカメラに話す。',
      mean: 'update ＝ 最新の状態にする。新しく変わった点を知らせる会。',
      trap: 'once a year から「去年の復習」と取りやすい。目的は updating のあと。',
      use: 'Can you update me on the project?（プロジェクトの最新状況を教えて）' },

    // why: useful ← "change… all the time" taken at face value; a chore ← "once a year" (said just before) heard as
    //   the complaint
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'change', reveals: ['thousand', 'seminar'], seg: [13.5, 19.3],
      stem: 'In the comment to camera, how does the speaker see the yearly updates?',
      choices: ['As a joke, since old arts hardly ever change', 'As useful, since old arts keep changing fast',
                'As a chore, since they come only once a year'], a: 0,
      cue: '「as we all know」から文末まで。語の組み合わせ。',
      line: 'the one thing that *thousand-year-old* martial arts do *all the time*… is change.',
      said: '「千年続く武術がいつもしていることといえば、変化だ」と言う。',
      mean: '千年変わらないものに「いつも変化」と言うのは皮肉。最新情報など、ほぼない。',
      trap: 'as we all know を本気の前置きと取りやすい。古さと変化が並んだら皮肉を疑う。',
      use: 'As we all know, Mondays are everyone’s favorite.（ご存じのとおり、月曜はみんな大好きだよね）' },

    // why: a hundred ← hundred/thousand, the near sound; ten thousand ← "thousand" heard, the size before it lost
    { id: 'n1', skill: 'number', level: 'B1', point: 'thousand', seg: [13.5, 19.3],
      stem: 'How old does the comment to camera say martial arts are?',
      choices: ['A hundred years old', 'A thousand years old', 'Ten thousand years old'], a: 1, keep: true,
      cue: '「the one thing that」のすぐあと。',
      line: 'the one thing that *thousand-year-old* martial arts do',
      said: '「千年の歴史がある武術」と言う。',
      mean: 'thousand-year-old ＝ 千年前からある。数字＋year-old で、名詞の前に置ける。',
      trap: 'hundred と thousand は語尾が似る。thou の「サウ」と、ten が前に付くかを聞く。',
      use: 'It’s a two-hundred-year-old house.（築200年の家だよ）' },

    // anchor: 14–18.7 s to camera, "the one thing… thousand-year-old martial arts do all the time is change"; 19.9–38.4 s
    //   Dwight's "relatable" set-up (Yakuza, a trolley museum, triads) ends in "You cannot go wrong with a throat punch"
    // R fix: V2, the key was the only witty, quoted choice; the "relatable" filler is now the direction flip of the key
    // why: a real change ← the update taken at face value (sincerity flip); an old story, a new punch ← right
    //   mechanism, wrong direction: the Yakuza set-up is the new part, and "can't go wrong with" marks the punch as the old
    //   standby
    { id: 'c1', skill: 'infer', level: 'C2', point: 'change', reveals: ['throat', 'seminar'], seg: [13.5, 38.9], retired: true,
      stem: 'After the comment to camera, how should we hear Dwight’s Yakuza story?',
      choices: ['As this year’s “update”: a new story, an old punch', 'As a real change: a new defense for a new attack',
                'As this year’s “update”: an old story, a new punch'], a: 0,
      cue: 'カメラへの一言と、長い設定のあとの答え。',
      line: 'martial arts do all the time… is *change*. … You cannot go wrong with a *throat punch*.',
      said: 'カメラへの皮肉のあと、ドワイトはヤクザと博物館の長い設定を話し、答えは「のど突き」。',
      mean: 'カメラへの皮肉が場面を書きかえる。新しいのは作り話だけで、技は昔からの突き。',
      trap: '新旧を逆に取りやすい。新しいのは派手な設定で、技は「失敗しない」いつもの突き。',
      use: 'Same old pizza, new box.（中身はいつものピザ、箱だけ新しい）' },

    // why: escape ← "arrives" heard as the attackers coming, so they must get out first; the trolley ← "Trolley
    //   Museum" is the last place word heard
    { id: 'd1', skill: 'detail', level: 'B2', point: 'holdoff', seg: [32.0, 36.1],
      stem: 'In Dwight’s story, what problem does he ask them to solve?',
      choices: ['How to keep the attackers back until help comes', 'How to escape the museum before the attackers come',
                'How to beat the attackers before the trolley comes'], a: 0,
      cue: '「How can you」で始まる問いの後半。',
      line: 'How can you *hold them off* until your *clan arrives*?',
      said: '「仲間が来るまで、どうやって敵を食い止める？」と問いかける。',
      mean: 'hold off ＝ 近づけない。clan ＝ 自分の組。助けが来るまで持ちこたえる話。',
      trap: 'arrives を敵の到着と取ると「逃げる」になる。until の後ろは誰が来るかを聞く。',
      use: 'Can you hold them off for five minutes?（5分だけ待たせておいて）' },

    // why: the nose ← "broken nose… boom" shouted at the start; the knee ← a common karate move, the "throat" sound lost
    { id: 'd2', skill: 'detail', level: 'B1', point: 'throat', seg: [35.6, 39.2],
      stem: 'What move does Dwight say always works?',
      choices: ['A punch to the throat', 'A hard punch to the nose', 'A kick to the knee'], a: 0,
      cue: '「You cannot go wrong with」のあと。',
      line: 'You *cannot go wrong* with a *throat punch*.',
      said: '「のど突きなら失敗しない」と答える。',
      mean: 'can’t go wrong with ～ ＝ ～なら失敗しない。おすすめの決まり文句。',
      trap: '冒頭で broken nose と何度も叫ぶので鼻を選びやすい。ここでは throat の「スロウ」を聞く。',
      use: 'You can’t go wrong with the pasta here.（ここのパスタならまず外れない）' },

    // R fix: V2 + K3, "Kevin lost a shoelace" was a filler and the key the only judgment; now three parallel reasons
    // why: too rough with Dwight ← who did what to whom is lost at speed (wrong direction); ripped his pants ← "pants"
    //   is said, but Dwight pulled them down (keyword trap)
    { id: 'd3', skill: 'detail', level: 'B1', point: 'lasttime', seg: [46.9, 53.2],
      stem: 'Why does Kevin say no when Dwight picks him?',
      choices: ['Dwight was too rough with him last time', 'He was too rough with Dwight last time',
                'He ripped his pants in the last class'], a: 0,
      cue: '「No way」のあと、「Last time」で始まる話。',
      line: 'Last time *you pulled my pants down*… then *you tried to choke me* with my shoelace.',
      said: '「前回はズボンを下ろされ、靴ひもで首を絞められかけた」と断る。',
      mean: '練習相手になるとひどい目にあう、という理由。',
      trap: '速いと主語を落とし、ケビンがやった話に聞こえる。you pulled、you tried の you を拾う。',
      use: 'No way. Last time I got lost.（無理。前回は迷子になったんだ）' },

    // R fix: V2, the key was the only choice about a correction; the cold-apology filler is gone and the distractors
    //   are a denial and a correction of the wrong detail
    // why: made it up ← "False" heard as calling Kevin a liar; the pants part ← he does correct one part, but the
    //   choking, not the pants
    { id: 'h1', skill: 'humor', level: 'C1', point: 'false', reveals: ['lasttime'], seg: [46.9, 56.0],
      stem: 'When Dwight answers Kevin with “False…”, why is it funny?',
      choices: ['His correction makes his own story worse', 'He says Kevin made the whole story up',
                'He corrects the pants part, not the choking'], a: 0,
      cue: 'ケビンの tried と、ドワイトの言い直し。',
      line: 'you *tried to* choke me… — False. I *did* choke you with your shoelace.',
      said: 'ケビンが「絞めようとした」と言うと、ドワイトは「違う。実際に絞めた」と言い直す。',
      mean: '否定したのは「未遂」の部分だけ。訂正したら、もっとひどい話になった。',
      trap: 'False を「そんなことはない」と取りやすい。否定のあとは、どこを直したかを聞く。',
      use: 'Correction: I ate three, not two.（訂正、2個じゃなくて3個食べた）' },

    // R fix: S4, the seg started at 46.9 (15.5 s); it now starts at 48.2, on "Last time". V2, the key was the only
    //   self-serving choice; "just Kevin" (scope) replaces "a stronger partner"
    // why: just Kevin ← it follows Kevin's refusal, but "respect to everyone here" covers them all (scope shift); his
    //   own worst enemy ← "the opponent of you is you" heard as the idiom about self-defeat
    { id: 'i2', skill: 'infer', level: 'C1', point: 'worthy', reveals: ['respect'], seg: [48.2, 62.4],
      stem: 'What is the coworker really after with the “most worthy opponent” line?',
      choices: ['Getting all of them out of fighting Dwight', 'Getting just Kevin out of fighting Dwight',
                'Getting Dwight to see he’s his own worst enemy'], a: 0,
      cue: 'ケビンが断った理由と、その直後の提案。',
      line: 'I think *the most worthy opponent of you is you*.',
      said: 'ケビンが断った直後、「あなたにふさわしい相手は、あなた自身だ」と言う。',
      mean: 'ほめる形で、誰も相手をしなくて済むようにしている。ドワイトにひとりで戦わせる作戦。',
      trap: '「自分が最大の敵」という言い回しに聞こえやすいが、ここは誰が相手をするかの話。',
      use: 'Honestly, only you can do it.（正直、できるのは君だけ）' },

    // R fix: B1, the stem ("I ___ choke you with your shoelace") gives away d3; added reveals
    // why: didn't ← "False" sets up a denial, and the t of n't is hard to hear; tried to ← an echo of Kevin's words
    { id: 's1', skill: 'sound', level: 'B2', point: 'false', reveals: ['lasttime'], seg: [53.0, 56.0],
      stem: 'Fill the gap: “False. I ___ choke you with your shoelace.”',
      choices: ['did', 'didn’t', 'tried to'], a: 0,
      cue: 'I のあと、強く短く言われる一語。',
      line: 'False. I *did* choke you with your shoelace.',
      said: '「違う。本当に絞めた」。did を強く言う。',
      mean: '肯定文の did は「本当に～した」の強調。否定ではなく、事実を言い張っている。',
      trap: 'False のあとなので didn’t を予想しやすい。didn’t なら「ン」が残る。強く短い did だけ。',
      use: 'I did lock the door. I checked.（ちゃんと鍵はかけた。確かめたよ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'comeat', seg: [54.65, 57.45],
      stem: 'Type what Dwight says after the shoelace line: “Now, ___.” (3 words)', answer: 'come at me',
      cue: '「shoelace」のすぐあと、短い命令。',
      line: 'Now, *come at me*.',
      said: '「さあ、かかってこい」。3語がひと続きに言われる。',
      mean: 'come at ～ ＝ ～に向かってくる、攻めかかる。挑発の決まり文句。',
      trap: 'come at me が「カマッミー」のようにつながり、at が消えやすい。前置詞を一語足して書く。',
      use: 'Come at me with your best offer.（いちばんいい条件で来てよ）' },

    // R fix: V2 + K3, the thank-you filler is gone; the choices are now soften/respect × the others/Dwight
    // why: respect for everyone ← "respect to everyone here" taken literally (keyword trap); criticism of Dwight ← the
    //   right function, the wrong target: the remark flatters Dwight
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'respect', seg: [56.2, 62.4],
      stem: 'When a coworker opens with “Okay, with all due…”, what is the opening for?',
      choices: ['To soften a remark about the others in the room', 'To show real respect for everyone in the room',
                'To soften a criticism of Dwight’s demo'], a: 0,
      cue: 'respect の直後の「to 誰」と、そのあとの話。',
      line: 'with *all due respect to everyone here*, I think the most worthy opponent of you is you.',
      said: '「皆さんには失礼ながら」と前置きし、ドワイトの相手は本人だけ、と言う。',
      mean: '相手が喜ばない話の前置き。ここでは「皆では力不足」と言う前。',
      trap: 'respect を「尊敬」と取りやすい。この前置きのあとには、言いにくい話が来る。',
      use: 'With all due respect, I disagree.（お言葉ですが、反対です）' },

    // R fix: V2, the joke filler is gone; "sees through the flattery" is a near miss, since the line is flattery (i2)
    // why: sees through it ← the coworker's line really is flattery with a motive, but Dwight answers "That is
    //   correct"; plays it down ← the Japanese frame: praise is met with modesty
    //   (謙遜), so the add-on sounds like one
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'correct', seg: [62.2, 65.75],
      stem: 'How does Dwight take the coworker’s compliment?',
      choices: ['As plain fact; he agrees at once', 'As flattery; he sees right through it', 'As too much; he plays it down'],
      a: 0,
      cue: 'ほめ言葉のすぐあと、最初の3語。',
      line: '*That is correct.* Unless there happen to be measles present.',
      said: '「その通りだ」とすぐ認め、「はしかがいなければな」と付け足す。',
      mean: 'That is correct は事実を確かめる固い言い方。謙遜も照れもない。',
      trap: 'ほめられたら謙遜、という型で聞くと Unless を遠慮に取る。最初の一言で態度が決まる。',
      use: 'That is correct. I made it myself.（そのとおり。自分で作ったんだ）' },

    // R fix: K5 + V2, the key was the only choice not starting "He admits"; all three are now "He says…"
    // why: he's ill ← "measles" heard as his own illness today; a coworker could win ← "Unless" heard as taking the
    //   praise back
    { id: 'h2', skill: 'humor', level: 'C1', point: 'correct', seg: [62.2, 65.75],
      stem: 'Why is Dwight’s “Unless…” add-on funny?',
      choices: ['He says only a disease could ever beat him', 'He says he’s ill, so he can’t fight today',
                'He says a coworker could beat him after all'], a: 0,
      cue: 'Unless のあとに出てくる「相手」。',
      line: 'That is correct. *Unless there happen to be measles present*.',
      said: '「その通り。ただし、はしかがその場にあれば話は別だ」と言う。',
      mean: '自分に勝てるのは自分か病気だけ、という大まじめな自慢。例外の選び方がおかしい。',
      trap: 'Unless を「実は負けるかも」と取りやすいが、出てくるのは人でなく病気。',
      use: 'I never get lost. Unless there’s no signal.（迷子にはならない。電波がなければ別）' },

    // R fix: K1 + V2, "as a real match" clashed with c3 (the coworker is mocking, not sincere), and "back to work" was
    //   a filler; the key is now "play along", and the fool line read literally is the new distractor
    // why: tell him to stop ← "making you look like such a fool" taken as plain criticism; break it up ← "Oh my God"
    //   heard as worry
    { id: 'g2', skill: 'gist', level: 'B2', point: 'eggon', reveals: ['upperhand', 'fool'], seg: [65.3, 115.3],
      stem: 'How do those watching respond to Dwight’s fight with himself?',
      choices: ['They play along, as if it were a real match', 'They tell him he looks silly and should stop',
                'They get worried and try to break it up'], a: 0,
      cue: '見ている側の質問や声かけの中身。',
      said: '「もう片方の手は？」「ばかにされてるよ」「互角だね」と、試合のように声をかける。',
      mean: '止めずに実況してあおっている。ドワイトはそれを本気で受けて戦い続ける。',
      trap: 'Oh my God を心配の声と取りやすい。そのあとの言葉が止める話か、あおる話かを聞く。',
      use: 'Come on, keep going!（ほら、続けて！）' },

    // R fix: V2, the "unsure" filler is gone; "just say" read literally ("just tell us") replaces it
    // why: a summary ← "So" heard as wrapping up what Dwight agreed to; explain, not show ← "just say" read literally as
    //   "just tell us"
    { id: 'm1', skill: 'marker', level: 'B2', point: 'letssay', reveals: ['throat', 'comeat'], seg: [65.35, 71.95],
      stem: 'After the measles line, what do the coworker’s first few words do?',
      choices: ['Set up an imagined fight to try out', 'Sum up what Dwight has just agreed to',
                'Ask Dwight to just explain, not show, a move'], a: 0,
      cue: 'So のあとの3語と、続く話の中身。',
      line: '*So, let’s just say* that Dwight has come at you with the throat punch.',
      said: '「じゃあ、仮にドワイトがのど突きで向かってきたとしよう」と言う。',
      mean: 'let’s just say ＝ 仮に～としよう。想定の場面を作る前置き。',
      trap: 'So を「まとめ」、say を「言って」と取りやすい。後ろに that＋想定の話が来るかを聞く。',
      use: 'Let’s just say the train is late.（仮に電車が遅れたとしよう）' },

    // R fix: V2, "Kevin" was a weak option; a generic "he" (any attacker) is the near miss a learner takes
    // why: any attacker ← "he" heard as generic, a rule for real fights; "Good point. Second throat punch" shows Dwight
    //   takes it as his own other hand; a triad ← the attackers in Dwight's story
    { id: 'i1', skill: 'infer', level: 'C1', point: 'twohands', reveals: ['throat'], seg: [80.2, 85.4],
      stem: 'In the coworker’s question about the other hand, who is “he”?',
      choices: ['Dwight, as the one attacking', 'Any real attacker in a street fight', 'A triad from the museum story'],
      a: 0,
      cue: '「he does have two」と、そのあとの返事。',
      line: 'what if *he* comes at you with the other hand because *he does have two*? — Good point. *Second* throat punch.',
      said: '「手は2本あるし、もう片方で来たら？」と聞かれ、「いい点だ。2発目」と応じる。',
      mean: 'he は攻める役のドワイト自身。ひとりで両役なので、手も2本。',
      trap: 'he を一般の敵や話の敵と取りやすい。すぐ Second throat punch と続く。',
      use: 'Good point. I hadn’t thought of that.（いい指摘。それは考えてなかった）' },

    // R fix: K2 wording, "let it pass through" isn't what absorb means; now "soak it up"
    // why: block ← "Block" was his move just before; hit back ← a fight scene's usual next move
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'absorb', reveals: ['throat'], seg: [83.0, 87.5],
      stem: 'After the second punch, what does Dwight tell himself to do?',
      choices: ['Take the hit and soak it up', 'Block the hit with his other arm',
                'Hit back at once just as hard'], a: 0,
      cue: '「Second throat punch」のあとの2語目。',
      line: 'Second throat punch. *Absorb the blow*.',
      said: '2発目ののど突きのあと、「衝撃を受け止めろ」と自分に言う。',
      mean: 'absorb the blow ＝ 打撃を受け止めて流す。防がずに耐えること。',
      trap: '少し前に Block と言ったので「防ぐ」を選びやすい。absorb は吸収、つまり受ける側。',
      use: 'The company can absorb the cost.（会社がその費用をかぶれる）' },

    // R fix: K5 + V2, the denial is now parallel ("disagrees… winning") so the key isn't one of only two "agrees"
    // why: disagrees ← "really" missed, the reply heard as pushing back; stops ← "not for long" heard as "I won't keep
    //   this up long"
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'fool', seg: [96.6, 101.6],
      stem: 'How does Dwight answer the remark that he looks like a fool?',
      choices: ['He agrees, and vows to turn it around', 'He disagrees, and says he’s winning',
                'He agrees, and says he’ll stop now'], a: 0,
      cue: '短い同意のあと、but で始まる一言。',
      line: 'He’s making you look like such a fool. — He *really is*, *but not for long*.',
      said: '「ばかにされてるね」に「確かに。だが今のうちだ」と返す。',
      mean: 'not for long ＝ 長くは続かない。すぐ逆転するという宣言。',
      trap: 'not for long を「もうやめる」と取りやすい。続かないのは、ばかにされている状態のほう。',
      use: 'I’m behind now, but not for long.（今は遅れてるけど、すぐ追いつく）' },

    // R drop: c2 (humor C2, who the joke is on). Blind 75 %: the key was the only clever, quoted choice, and the item
    //   duplicated i1 (he = Dwight) and a3 (same line, same point). One rewrite couldn't make a Dwight-centred near miss
    //   that isn't also defensible, so it goes (never shipped).


    // R fix: S2 + V2, the stem quoted "evenly matched", which gives the meaning of "upper hand"; the stem is neutral and
    //   "the real Dwight" (identity reading of "one of you") replaces the floor option
    // why: the real Dwight ← "one of you" heard as about which one is which; the higher hand ← "upper hand" taken
    //   literally (上の手)
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'upperhand', seg: [111.7, 115.3],
      stem: 'Near the end of the fight, what does the coworker say is hard to tell?',
      choices: ['Which of them will gain the advantage', 'Which of them is the real Dwight',
                'Which of them will grab the higher hand'], a: 0,
      cue: '文の最後、get the のあとの2語。',
      line: 'I don’t know how one of you is going to *get the upper hand*.',
      said: '「互角すぎて、どっちが優位に立つか分からない」と言う。',
      mean: 'get the upper hand ＝ 優位に立つ。手そのものの話ではない決まり文句。',
      trap: 'upper を「上」、hand を「手」と字のまま取りやすい。形で覚える。',
      use: 'Their team got the upper hand late.（終盤で相手チームが優位に立った）' },

    // anchor: 74–76.4 s "I am attacking myself"; 112.2–114.6 s "You two are so evenly matched" said to one man: the
    //   match can't be anything but even
    // R fix: V2, the "worry" filler is gone; "losing even to himself" is a mocking reading in the wrong direction
    // why: sincere ← "evenly matched" taken as real praise for two fighters (sincerity flip); losing ← the mockery heard,
    //   but "evenly matched… don't know how one of you" says nobody is ahead (right mechanism, wrong direction)
    { id: 'c3', skill: 'infer', level: 'C2', point: 'upperhand', reveals: ['twohands'], seg: [111.7, 115.3], retired: true,
      stem: 'Which plain-English version keeps what the coworker means?',
      choices: ['“Of course it’s even. It’s one man.”', '“They’re both so good, I can’t pick one.”',
                '“Even against himself, Dwight is losing.”'], a: 0,
      cue: '「You two」と呼ばれているのが何人か。',
      line: '*You two* are so *evenly matched*, I don’t know how one of you is going to get the upper hand.',
      said: 'ひとりで戦うドワイトに「お二人は互角すぎて、どっちが勝つか分からない」と言う。',
      mean: '一人なら互角に決まっている。本気の実況のふりで、ばかばかしさを言っている。',
      trap: '実況の言葉をそのまま取りやすい。相手が何人かを確かめれば、ほめ言葉でないと分かる。',
      use: 'Wow, a tie. Who saw that coming?（へえ、引き分け。誰が予想した？）' },

    { id: 'x2', skill: 'dict', level: 'B1', point: 'surprise', seg: [115.0, 121.6],
      stem: 'Type the end of Dwight’s tip to Jim: “what is called the ___.” (3 words)', answer: 'element of surprise',
      cue: '「what is called the」のあと、少し間があく。',
      line: 'we always have what is called the *element of surprise*.',
      said: '「我々には、いわゆる不意打ちという武器がある」とジムに言う。',
      mean: 'the element of surprise ＝ 不意をつくこと。相手が予想しない強み。',
      trap: 'element of が「エレメンタブ」のようにつながる。of を落とさず3語で書く。',
      use: 'Let’s keep the element of surprise.（サプライズは秘密にしておこう）' },
  ]
};
