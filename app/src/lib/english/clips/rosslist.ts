// “Rachel Makes a List About Ross | Friends” (the official Friends channel, Best of Season 2): Ross offers to let
// Rachel make a list of his faults to cheer her up; she refuses, then reels one off at once, and ends up really
// feeling better while Ross stammers.
// Segments from the captions, words from whisper (2026-11-16). Captions run ~1–1.5 s behind whisper's rough times at
// the start; segments follow the captions. Only Ross and Rachel speak, each named by the other (“Rach”, “Ross”).
// Untested on purpose: 12–13 s (whisper's “Come on, Rach, I think it'll—” isn't in the captions), 22.5 s (“like me” in
// the captions, “liked me” in whisper; no key rests on the tense), 43–62 s (music; whisper invents “Thank you.”).
// EAR CHECK: 40.3 s nt2 — the stress falls on “do” in “I do feel better” (both sources have the words)
// REVIEW 2026-11-16: pass 4, fix 14, drop 2, new 2; ear checks 1
// Open: a3's “Thank you, Ross” is keyed sincere from the words (“You're right. I do feel better.”); it's off the ear
//   list, so flag it if her voice sounds sarcastic on the phone.
import type { Clip } from '../types.ts';

export const rossList: Clip = {
  id: 'rosslist', video: 'bTEe1FeC0Pk', title: 'Rachel Makes a List About Ross', dur: 62, wpm: 124, band: 'slow',
  tags: ['友だち', '恋愛'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R drop: d1 (detail B1, "a list about me"). The title answers it (GUIDE §9.4; blind 70 %), and no rewording of
    //   the choices gets around the title. Never shipped, so it's deleted; d4 replaces it (literal count stays 4)

    // R fix: V2 (blind 70 %): "make Rachel feel better again" was the only kind choice, and s1's stem shows the
    //   words. "To show he can take criticism" (right that he invites faults, wrong aim) replaces the settle-the-fight
    //   filler; the reveals drop d1's point
    // why: likes ← "a list about me" heard as a list of good points; criticism ← right that he invites a list of
    //   faults, wrong aim: what he says it's for is "feel better"
    { id: 'g2', skill: 'gist', level: 'B2', point: 'purpose', reveals: ['whatll'], seg: [0, 16],
      stem: 'Why does Ross bring up his idea?',
      choices: ['To help Rachel feel better', 'To hear what she likes about him', 'To show he can take criticism'],
      a: 0,
      cue: '提案の直前、「I think」のあと。',
      line: 'I think I know *what’ll make you feel better*.',
      said: 'Ross は「気分が良くなる方法がある」と言って提案する。',
      mean: '目的は Rachel の気分を直すこと。what’ll は what will の短縮。',
      trap: '「好きな所を聞きたい」とも取れるが、目的は本人が feel better と言っている。',
      use: 'I know what’ll cheer you up.（元気が出るもの、分かるよ）' },

    // R fix: V2 (blind 60 %): "invites criticism" was the only start the title allows. All three now start "Ross
    //   invites criticism, and…", so the choice is how it ends. Trap rewritten
    // why: angrier ← right start, wrong outcome: a list of faults sounds like a fight getting worse; turns it down ←
    //   her first "Forget it, Ross" taken as the end of it
    { id: 'g1', skill: 'gist', level: 'B2', point: 'scene', reveals: ['purpose', 'thanks'], seg: [0, 43.5],
      stem: 'How does the scene play out, from start to end?',
      choices: ['Ross invites criticism, and it really cheers her up',
                'Ross invites criticism, and it only makes her angrier',
                'Ross invites criticism, and she turns it down'], a: 0,
      cue: '最初の提案と、最後の Rachel の一言をつないで。',
      said: 'Ross が自分のリストを勧め、Rachel は欠点を並べ、最後は「良くなった」と言う。',
      mean: '自分を批判させる作戦が、予想以上に効いてしまう場面。',
      trap: '最初の Forget it で終わったと取ると、流れを見落とす。最後の一言まで聞く。',
      use: 'Go ahead, tell me what you really think.（どうぞ、本音を言って）' },

    // R fix: V2 (blind 60 %): "what can" is the least idiomatic, so a blind read drops it. "what could" (a
    //   d-like stop, like the flap) replaces it. Trap extended
    // why: what'd ← the flapped t makes a d, and the dark l is easy to miss; what could ← the d-like flap heard as the
    //   end of "could"
    { id: 's1', skill: 'sound', level: 'B2', point: 'whatll', seg: [2.6, 8.9],
      stem: 'Fill the gap: “I think I know ___ make you feel better.”',
      choices: ['what’ll', 'what’d', 'what could'], a: 0,
      cue: '「I know」の直後、短くつながった音。',
      line: 'I think I know *what’ll* make you feel better.',
      said: '「気分が良くなるもの、分かると思う」。',
      mean: 'what’ll は「ワドル」に近い。t が弾んで d になり、will は l だけ残る。',
      trap: 'd が聞こえると what’d を選びやすい。暗い l が残れば will、k の音があれば could。',
      use: 'That’ll be fine.（それで大丈夫です）' },

    // R fix: V2 (blind 50 %): "a polite yes, just to be nice" had no pull. "A quick yes: she starts right away" (she
    //   does start seconds later) and "a soft no" (遠慮) replace the old pair. Trap rewritten
    // why: quick yes ← she starts the list a few seconds later, so the order flips; soft no ← the Japanese frame: a
    //   refusal heard as 遠慮, though "Forget it" is blunt
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'refuse', seg: [8.6, 13.1],
      stem: 'What is Rachel’s first answer to Ross’s idea?',
      choices: ['A firm no: she won’t make any list', 'A quick yes: she starts right away',
                'A soft no: she doesn’t want to hurt him'], a: 0,
      cue: '「What?」のあと、名前を呼んでから。',
      line: 'What? *Forget it*, Ross. *No*, I’m not gonna stand here and make a list of…',
      said: '「は？やめてよ、Ross。そんなリスト作らないから」と断る。',
      mean: 'Forget it ＝「その話はなし」。きっぱりした断り。',
      trap: '数秒後にリストを始めるので「すぐ承知」と取りやすいが、最初の返事は Forget it と No。',
      use: 'Forget it. I’m not doing that.（やめとく。それはしない）' },

    // R fix: V2 (blind 65 %): the key was the only choice about timing. All three now start "She said she
    //   wouldn't, then…"
    // why: praise ← "Okay" heard as a soft, agreeing opener; her own ← insecure/obsessive sound like self-criticism
    //   when the weak "you're" is lost
    { id: 'h1', skill: 'humor', level: 'C1', point: 'ready', reveals: ['refuse'], seg: [8.6, 19.6],
      stem: 'Why does the audience laugh as Rachel starts with “Okay, you’re…”?',
      choices: ['She said she wouldn’t, then starts at once', 'She said she wouldn’t, then starts with praise',
                'She said she wouldn’t, then lists her own faults'], a: 0,
      cue: '断ったすぐあと、何秒で始めるか。',
      line: 'I’m not gonna stand here and make a list of… — *Okay*, you’re whiny.',
      said: '「リストなんか作らない」の直後に「じゃあ言うけど、泣き言ばっかり」と始める。',
      mean: '断ったそばから始めるので、本当は言いたかったと分かる。言葉と行動の落差が笑い。',
      trap: 'Okay を優しい前置きと取ると流れが見えない。ここは「じゃあ言うけど」の切りかえ。',
      use: 'Okay, since you asked…（じゃあ、聞かれたから言うけど…）' },

    // R fix: V2 + S1 (blind 65 %): "how quickly" in the stem pointed at "thought about it before". The stem now
    //   names the moment, and "saying what he wants to hear" (気をつかう) replaces "what her friends say". Reveals
    //   d4's point, since the line shows its key
    // why: inventing ← the laugh track makes it sound like a comedy bit; wants to hear ← the Japanese frame: going
    //   along with what he asked, though faults aren't what anyone wants to hear
    { id: 'i2', skill: 'infer', level: 'C1', point: 'ready', reveals: ['faults'], seg: [8.6, 19.6],
      stem: 'What does Rachel’s list suggest, given she just said no?',
      choices: ['She had these faults in mind already', 'She is inventing faults to be funny',
                'She is saying what he wants to hear'], a: 0,
      cue: '次々に出てくる言葉の速さと、間のなさ。',
      line: '*Okay*, you’re whiny. You are… you’re obsessive. You are insecure.',
      said: '断ったばかりなのに、泣き言、こだわりすぎ、自信がない…と迷わず並べる。',
      mean: '考えずに次々出てくるのは、前から思っていたから。速さそのものが本音の証拠。',
      trap: '笑いが起きるので作り話に聞こえやすい。断った直後に迷わず続く時は、前から思っていたこと。',
      use: 'I’ve been meaning to tell you this.（ずっと言おうと思ってたんだけど）' },

    // R new (replaces d1): a literal detail on two list words, each with a near-sound twin. No choice shares a word
    //   with another, so a blind read can't find the key by overlap (about 35 %)
    // why: possessive/aggressive ← the stressed "-ssive" ending caught, the start lost; insincere/unsure ← the "in-"
    //   or "-sure" of "insecure" caught alone
    { id: 'd4', skill: 'detail', level: 'B1', point: 'faults', seg: [12.5, 19.6],
      stem: 'After “whiny”, which two faults does Rachel name next?',
      choices: ['Obsessive and insecure', 'Possessive and insincere', 'Aggressive and unsure'], a: 0,
      cue: '「whiny」のあと、You are… と言い直す所。',
      line: 'You are… you’re *obsessive*. You are *insecure*.',
      said: '「泣き言が多い」に続けて、二つの欠点を言う。',
      mean: 'obsessive ＝ こだわりすぎ、insecure ＝ 自信がなく不安。',
      trap: '語尾や語頭だけ拾うと、似た語に聞こえる。possessive、insincere とは真ん中の音が違う。',
      use: 'I get a little obsessive about details.（細かいことにこだわりがちなんだ）' },

    // R fix: V2 + S2 (blind 85 %): the stem quoted the word under test, so it was a vocabulary question. The stem
    //   now names the moment, and the choices pair three "-less" sound-alikes with their meanings. Trap rewritten;
    //   reveals d4's point (the line shows "insecure")
    // why: clueless ← the same "-less" ending, the g/k start blurred; careless ← "-less" plus a soft start heard as
    //   "care"
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'gutless', reveals: ['faults'], seg: [16.5, 19.6],
      stem: 'Right after “insecure”, what does Rachel call Ross?',
      choices: ['Gutless, with no courage', 'Clueless, with no idea', 'Careless, with no caution'], a: 0,
      cue: '「insecure」のあと、2回言いかけてからの一語。',
      line: 'You are insecure. You’re… you’re *gutless*.',
      said: '「自信がない。それに…根性なし」と言う。you’re を2回言ってから。',
      mean: 'guts ＝ 度胸。gutless ＝ 度胸がなく、いざという時に動けない人。',
      trap: 'どれも語尾の -less が同じ。頭の音を聞き分け、guts＝度胸と結びつける。',
      use: 'It takes guts to say that.（それを言うのは勇気がいるね）' },

    // R fix: V2 (blind 50 %): "get up early" was the only literal reading with no pull. "Take a day off now and then"
    //   (the literal "day" plus "take") replaces it. All three are now the same length. Trap rewritten
    // why: day off ← "the day" taken literally, plus "take"; plan ← "day" plus the obsessive-planner picture from
    //   just before
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'seize', seg: [19.4, 22.5],
      stem: 'What does Rachel say Ross never does?',
      choices: ['Grab chances when they come', 'Take a day off now and then', 'Plan out each day with care'], a: 0,
      cue: '「you don’t just sort of」のあと。',
      line: 'you don’t just sort of *seize the day*, you know?',
      said: '「その日をつかむようなこと、しないよね」と言う。',
      mean: 'seize the day ＝ チャンスを逃さず動く。思い切って行動しない彼への不満。',
      trap: 'day を「一日」と文字通りに取ると、休みや予定の話に聞こえる。',
      use: 'Seize the day. Just ask her.（チャンスだよ。誘ってみなよ）' },

    // R new (replaces nt1): C2, exact weak words in fast speech. "just sort of" runs soft and quick between the
    //   restart and "seize"; a learner's grammar drops it because the sentence works without it. It shares f1's
    //   point, since each one's line shows the other's answer
    // anchor: 20.7–21.3 s “you don't just sort of seize”: captions and whisper agree word for word; the three weak
    //   words take about half a second
    { id: 'nt3', skill: 'dict', level: 'C2', point: 'seize', seg: [19.4, 22.5], retired: true,
      stem: 'Type what she says: “you don’t ___ seize the day” (3 words)', answer: 'just sort of',
      cue: '言い直したあと、seize の前の弱い3語。',
      line: 'you don’t ever… you don’t *just sort of* seize the day',
      said: '「…思い切って動いたりしないよね」。just sort of は弱く速い。',
      mean: 'just sort of が「ジャスソータ」とつながる。sort of で言い方をぼかしている。',
      trap: 'なくても文が通じるので、聞こえても頭で消しやすい。言い直しのあとの弱い語が、言い方の温度を決める。',
      use: 'I just sort of forgot about it.（なんとなく忘れちゃって）' },

    // why: few years ← "what, a" heard as "a few"; few weeks ← a short crush sounds like the usual complaint
    { id: 'n1', skill: 'number', level: 'B1', point: 'year', seg: [19.4, 25.6], keep: true,
      stem: 'How long does Rachel say Ross liked her?',
      choices: ['A few weeks', 'About a year', 'A few years'], a: 1,
      cue: '「for」のあと、間を入れてから。',
      line: 'You liked me for, what, *a year*, and you didn’t…',
      said: '「1年くらい、私のこと好きだったのに」。what は「ええと」の間。',
      mean: 'この what は「ざっと」。数字の前に入る口ぐせ。',
      trap: 'what a が a few に聞こえやすい。year に s が付いていなければ1年。',
      use: 'It took, what, an hour?（ええと、1時間くらいかな？）' },

    // R fix: V2 (blind 60 %): "Nothing at all" was the only complaint-shaped choice. All three are now "He did/made…
    //   about it", with "did something" (the lost t of "didn't") as the near sound
    // why: something ← "didn't" with its t lost heard as "did"; list ← the scene's own word "list"
    { id: 'd3', skill: 'detail', level: 'B1', point: 'nothing', seg: [19.4, 25.6],
      stem: 'What does Rachel say Ross did about liking her?',
      choices: ['He did nothing about it', 'He did something about it', 'He made a list about it'], a: 0,
      cue: '「a year」のあと、and から始まる部分。',
      line: '…and *you didn’t do anything about it*.',
      said: '「なのに何もしなかった」と言う。',
      mean: 'do anything about it ＝ 行動に移す。好きなのに誘わなかった、ということ。',
      trap: 'didn’t の t が消え、do と続いて聞き落としやすい。否定が取れると逆の意味になる。',
      use: 'Are you going to do anything about it?（で、何か手を打つの？）' },

    // R fix: V2 (blind 60 %): "glad he kept it to himself" had no pull. "Wishes he had gotten over her sooner" (the
    //   year heard as too long) makes two "wishes" choices. Trap rewritten
    // why: gotten over ← "for, what, a year" heard as too long to like her; doubts ← "what, a year" heard as her
    //   questioning it
    { id: 'i1', skill: 'infer', level: 'C1', point: 'nothing', reveals: ['year'], seg: [19.4, 25.6],
      stem: 'What does Rachel imply with the line about him liking her?',
      choices: ['She wishes he had made a move back then', 'She wishes he had gotten over her sooner',
                'She doubts he ever really liked her'], a: 0,
      cue: '「a year」と「anything」の組み合わせ。',
      line: 'You liked me for, what, a year, and *you didn’t do anything about it*.',
      said: '「1年も好きだったのに、何もしなかった」と言う。',
      mean: '欠点のリストに入れているので、動いてほしかったという不満。行動しない彼への本音。',
      trap: '「1年も」を長すぎるという不満と取ると逆になる。不満の中身は didn’t do anything のほう。',
      use: 'You should have said something!（言ってくれればよかったのに！）' },

    { id: 'x2', skill: 'dict', level: 'B2', point: 'nothing', seg: [19.4, 25.6],
      stem: 'Type what she says: “and you didn’t ___.” (4 words)', answer: 'do anything about it',
      cue: '「a year」のあと。最後まで一息でつながる。',
      line: '…and you didn’t *do anything about it*.',
      said: '「なのに何もしなかった」。',
      mean: 'anything about it が「エニシンガバウリッ」とつながり、it の t はほぼ消える。',
      trap: 'about と it がくっつくので語数を数えにくい。about it はひとかたまりで覚える。',
      use: 'Let’s do something about it.（なんとかしよう）' },

    // R fix: V2 + S4 (blind 65 %): the segment ran 16.6 s (over 15) and now starts at "seize the day" (19.4 s). All
    //   three choices now start "After deep faults, she ends on…"
    // why: worst ← "too much" heard as a serious charge, the usual save-the-worst-for-last script; kind ← "your hair"
    //   plus the Japanese habit of ending on a compliment
    { id: 'h2', skill: 'humor', level: 'C1', point: 'gel', reveals: ['nothing'], seg: [19.4, 29.3],
      stem: 'What makes the very last item on Rachel’s list funny?',
      choices: ['After deep faults, she ends on a small one', 'After deep faults, she ends on the worst one',
                'After deep faults, she ends on a kind one'], a: 0,
      cue: '「uh, oh」と思い出したあとの一言。',
      line: '…you didn’t do anything about it. And, uh, oh, *you wear too much of that gel in your hair*.',
      said: '性格の欠点を並べたあと、思い出したように髪のジェルの話を足す。',
      mean: '性格の深い話のあとに、どうでもいい外見の話。重いから軽いへの落差が笑いになる。',
      trap: 'too much を強い非難と取ると「最悪の欠点」に見える。中身は髪型の小さな不満。',
      use: 'Oh, and one more thing…（あ、それともう一つ…）' },

    // R fix: V2 (blind 60 %): "hair too long" didn't match the words, and the stem allowed any remark. The stem now
    //   asks for the last fault, and "too much gray in his hair" (same frame, another short word) replaces it
    // why: cologne ← "wear too much" is the usual perfume phrase; gray ← "in your hair" heard, with the short word
    //   before it lost
    { id: 'd2', skill: 'detail', level: 'B1', point: 'gel', seg: [25.3, 29.5],
      stem: 'What is the last fault on Rachel’s list?',
      choices: ['Too much gel in his hair', 'Too much cologne on him', 'Too much gray in his hair'], a: 0,
      cue: '「uh, oh」と思い出したあと。',
      line: 'oh, you wear *too much of that gel* in your hair.',
      said: '「あと、髪にジェルつけすぎ」と付け足す。',
      mean: 'wear は服だけでなく、化粧品やジェルにも使う。',
      trap: 'wear too much は香水によく使うので cologne に引かれやすい。in your hair の前の短い語まで聞く。',
      use: 'You’re wearing too much perfume.（香水つけすぎだよ）' },

    // R drop: nt1 (attitude C2, "what is he trying not to say?"). The key (the list stung him) rests only on his
    //   stammer, which fits surprise or offence just as well: no words in the clip name it (native-level §2: "never a
    //   guess at a private thought"; V1 + K1). Never shipped, so it's deleted; nt3 replaces it

    // R fix: V2 (blind 55 %): "thanking her" and "did it wrong" had little pull. "Admitting that her list was fair"
    //   ("all right" heard as conceding) replaces the thanks
    // why: fair ← "all right" heard as conceding the list; wrong ← "what I said" heard as "not what I said"
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'saidit', seg: [33, 38.3],
      stem: 'What is Ross doing with his line right after her list?',
      choices: ['Taking credit, as if it went to plan', 'Admitting that her list was fair',
                'Telling her she did it all wrong'], a: 0,
      cue: '言いよどんだあと、最後の一文。',
      line: 'all right. *You did what I said*.',
      said: '「まあいいや。僕の言ったとおりにしたね」と言う。',
      mean: '自分の案だったことを持ち出して、その場の主導権を取り戻そうとしている。',
      trap: 'all right を「その通り」と取ると、リストを認めたように聞こえる。ここは話を切りかえる合図。',
      use: 'See? I told you it would work.（ほらね、うまくいくって言ったでしょ）' },

    // why: sarcastic ← thanks after a fight is often sarcastic in sitcoms; polite ← the Japanese frame: お礼 to close
    //   the talk
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'thanks', reveals: ['dofeel'], seg: [33, 43.2],
      stem: 'At the end, how does Rachel mean her “Thank you, Ross”?',
      choices: ['Sincerely; the list really did help', 'Sarcastically; she still feels hurt',
                'Politely; she just wants to leave'], a: 0,
      cue: '「you know what?」のあと、2つの短い文。',
      line: 'You’re right. I *do* feel better. Thank you, Ross.',
      said: '「あなたの言うとおり。本当に気分が良くなった。ありがとう」と言う。',
      mean: 'do で「本当に」と強めている。皮肉ではなく、本気で気が晴れたお礼。',
      trap: 'ケンカのあとのお礼は皮肉に聞こえやすい。直前の You’re right と I do が本気の証拠。',
      use: 'I do appreciate it.（本当に感謝してます）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'dofeel', seg: [37.9, 43],
      stem: 'Type what she says: “You’re right. I ___ better.” (2 words)', answer: 'do feel',
      cue: '「You’re right」のすぐあと。',
      line: 'You’re right. I *do feel* better.',
      said: '「あなたの言うとおり。本当に良くなった」。',
      mean: '肯定文の do は強調。「ちゃんと」「本当に」の気持ちが入る。',
      trap: '文法上なくてもいい do は、聞こえても頭で消してしまいやすい。強く言われる do に注意。',
      use: 'I do like it, honestly.（本当に気に入ってるよ）' },

    // R fix: V2 (blind 70 %): emphatic "do" is the textbook answer, and the two other stories were thin. A fourth
    //   choice, "feel" (feeling vs being, a common stress story), joins; all three distractors are now strong
    // anchor: 39.4–41.4 s “You're right” comes first: she is granting his prediction (“what'll make you feel better”,
    //   4–6 s), so the stress confirms (“do”); it doesn't compare, contrast her with him, or set feeling against being
    // why: feel ← the feel/be contrast ("I feel better, but nothing's changed"); better ← comparatives usually carry
    //   the stress; I ← right mechanism (contrast), wrong word: Ross looks hurt, but she isn't setting herself against
    //   him
    { id: 'nt2', skill: 'sound', level: 'C2', point: 'dofeel', seg: [37.9, 43], retired: true,
      stem: 'Where is the stress in “I do feel better”, and why?',
      choices: ['On “do”: yes, his idea really worked', 'On “feel”: a feeling only, nothing has changed',
                'On “better”: better than before the list', 'On “I”: unlike Ross, she feels good'], a: 0,
      cue: '短い文で、いちばん強く長く聞こえる語。',
      line: 'You’re right. I *do* feel better.',
      said: '「言うとおり。ほんとに良くなった」。do を強く言っている。',
      mean: '肯定文の do を強めると「確かに〜だ」。彼の「気分が良くなるよ」という予想を認めている。',
      trap: '比べる語の better に強勢を探しやすい。強勢は、直前の You’re right が何を認めたかに合わせて置かれる。',
      use: 'I did call you! Twice!（電話したってば！2回も）' },
  ]
};
