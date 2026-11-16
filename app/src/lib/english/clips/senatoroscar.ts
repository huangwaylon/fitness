// “Is the Senator Seducing Oscar? - The Office US” (the official The Office channel, BEST OF The Office - Season 8):
// the senator gives Oscar his cell number and Oscar decides he was hit on; a coworker tests the theory, gets both
// numbers too, and Oscar insists he isn't disappointed, until the senator's goodbye gives him hope again.
// Segments from the captions, words from whisper (2026-11-16). Untested: 4.8–7 s (whisper “animals… my dog Gerald”,
// captions “my dog Gerald”; the speaker of “is my life” is unclear), 50.3–51.7 s (whisper “schmoozing a voter”,
// captions “schmoozing him over”), 54.9–56 s (whisper “rock”, captions “run”), 57–66 s (Oscar acts out the look:
// visual), 68.7–71 s (the Downton Abbey exchange, a reference) and 74.9 s (captions “her cell phone”, whisper “his”).
// The coworkers are never named, so stems say “a coworker”. Oscar is named in both sources (“Okay, Oscar”).
// REVIEW 2026-11-16: pass 5, fix 15, drop 0, new 0; ear checks 1
// REVIEW: the s1 and nt1 ear checks are gone (both sources agree on “I'd have” and “would have seen”; rubric
//   addendum). The coworkers' genders aren't in the words, so p1's “she” is gone from the stem; g1, d3 and i1 now
//   avoid pronouns for the coworker. Open: d3/g1 still call the senator “he” (fine: Angela's husband).
// EAR CHECK: 107.0–107.7 s x1 g2 nt3 — “don't forget to call” is taken as the senator's, to Oscar (no name)
import type { Clip } from '../types.ts';

export const senatorOscar: Clip = {
  id: 'senatoroscar', video: 'Ga6N2au2xrc', title: 'Is the Senator Seducing Oscar?', dur: 129, wpm: 151,
  band: 'slow', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: five/seven ← "say after…" swallowed, and evening hours sound like work's end; keep ascending
    { id: 'n1', skill: 'number', level: 'B1', point: 'nine', seg: [11.2, 18.8],
      stem: 'After what time does the senator say he’s more likely to pick up?',
      choices: ['After five', 'After seven', 'After nine'], a: 2, keep: true,
      cue: '「at night, say」のあとの数字。',
      line: 'more likely to pick up at night, say *after nine*.',
      said: '「これが携帯。夜の方が出やすい。そうだな、9時以降」。',
      mean: 'say はここで「たとえば」。時間を具体的に言っている。',
      trap: 'say を「言う」と取ると、数字の前で流れを見失う。say のあとに例が来る。',
      use: 'Call me in the evening, say after seven.（夕方、そうね7時以降に電話して）' },

    // R fix: V2, the key was the only flattering choice; all three are now "still got…"
    // why: the number ← "got it" heard literally, as "I've got the card"; a good eye ← "I'm right" just before
    //   suggests being good at reading people
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'gotit', seg: [21, 27.45],
      stem: 'What is the second thing Oscar says the chat confirms?',
      choices: ['That he’s still got his charm', 'That he’s still got the number',
                'That he’s still got a good eye'], a: 0,
      cue: '三つ並ぶうちの、まん中。',
      line: 'I’m right about the senator, *I still got it*, and poor Angela.',
      said: 'カメラに「議員の読みは正しい、まだイケてる、アンジェラがかわいそう」。',
      mean: 'I’ve still got it ＝ 魅力や腕はまだ衰えていない。',
      trap: 'got it を「受け取った」と取ると番号の話になる。still got it は決まり文句。',
      use: 'Ha, I’ve still got it.（ふふ、まだまだいけるね）' },

    // R fix: V2, "angry at him" was weak; now shock, which his next line ("a very dramatic situation") invites
    // why: sorry ← "poor Angela" taken at face value (かわいそう); shocked ← "I stumbled into a very dramatic
    //   situation" comes right after
    { id: 't1', skill: 'attitude', level: 'C1', point: 'poor', seg: [21, 27.45],
      stem: 'In his list to the camera, how does Oscar seem to feel overall?',
      choices: ['More pleased than sorry for her', 'More sorry for her than anything',
                'More shocked than pleased by it'], a: 0,
      cue: '三つのうち、どれが先に来て、何が最後か。',
      line: '*I’m right* about the senator, *I still got it*, and poor Angela.',
      said: '自分が正しかったこと、まだモテることを先に挙げ、最後にアンジェラへの同情を添える。',
      mean: '自分の得点が二つ、同情は一言だけ最後。うれしさが勝っている。',
      trap: 'poor を聞くと同情が中心に聞こえる。並べる順番と、それぞれの長さを聞く。',
      use: 'Good news for me, bad news for him.（僕には朗報、彼には悲報）' },

    // R fix: V2, "the election" was a world-knowledge filler; now "the issues", which the coworker says later
    // why: Angela ← her name is all over the scene, and An- starts both; the issues ← the coworker's later "just
    //   want to talk about the issues"
    { id: 'd1', skill: 'detail', level: 'B1', point: 'animals', seg: [37.7, 41.4],
      stem: 'According to Oscar, what were he and the senator talking about?',
      choices: ['Animals', 'Angela', 'The issues'], a: 0,
      cue: '「talking about」のすぐあと。',
      line: 'Come on, we were *talking about animals*.',
      said: '「だって、動物の話をしてただけなのに」と言う。',
      mean: '話題は動物。それなのに番号を渡された、という流れの前置き。',
      trap: '場面に何度も出る名前や議員という立場に引っぱられやすい。about のあとの一語を聞く。',
      use: 'We were just talking about work.（仕事の話をしてただけだよ）' },

    // R fix: V2/K3, "unwell" was a filler; now the opposite direction (unsure about giving it)
    // why: unsure ← "dying" heard as reluctance, the wrong direction; asked for it ← "for me to have it" heard as
    //   Oscar requesting it
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'dying', seg: [41.1, 45.6],
      stem: 'How does Oscar describe the way the senator gave him the number?',
      choices: ['He was eager for Oscar to take it', 'He gave it only after Oscar asked',
                'He was unsure about giving it'], a: 0,
      cue: '「he was just」のあとの言い回し。',
      line: 'he was just *dying for me to have it*.',
      said: '「携帯番号をくれた。どうしても僕に持っててほしいって感じで」。',
      mean: 'be dying for ＝ 〜がほしくてたまらない。相手の熱心さを強調している。',
      trap: 'dying を「死ぬほど嫌」と取ると逆の意味になる。dying for＋人＋to は強い願い。',
      use: 'She’s dying for you to meet her.（彼女、あなたに会いたくてたまらないって）' },

    // R fix: V2, the key was the only two-part choice; S1: "she" presumed a gender the words don't give
    // why: a crush ← "you are" (dreamy) taken as the point; agreeing ← "I'm not saying…" heard as agreement
    //   with Oscar (the 前置き read as consent), with the compliment on top
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'dreamy', seg: [45.2, 51.7],
      stem: 'What is a coworker doing by calling Oscar “dreamy”?',
      choices: ['Cushioning a doubt with praise', 'Confessing a crush on Oscar',
                'Agreeing, and flattering him too'], a: 0,
      cue: '「because you are」のあとの but。',
      line: 'I’m not saying you’re not dreamy, *because you are*, *but* isn’t it possible…',
      said: '「あなたが素敵じゃないとは言わない、素敵だし。でも、ただの愛想だったかも」。',
      mean: 'ほめ言葉は前置き。本題は but のあとの「勘違いかも」。',
      trap: 'because you are を告白と取りやすい。but のあとに本音が来る。',
      use: 'You’re great, but are you sure?（あなたは素敵、でも本当にそう？）' },

    // anchor: 51.6–53.4 s both sources have “If you would have seen the look he gave me”; standard grammar wants
    //   “had seen”, which is what a learner writes
    { id: 'nt1', skill: 'dict', level: 'C2', point: 'look', seg: [51.6, 54.5],
      stem: 'Type Oscar’s words, as said: “If you ___ the look he gave me.” (3 words)', answer: 'would have seen',
      cue: '「If you」のすぐあと。文法より、聞こえた音を。',
      line: 'If you *would have seen* the look he gave me.',
      said: '「あの目つきを見ていたら」。would have seen と言い、3語は速くつながる。',
      mean: '教科書なら if you had seen だが、会話では would have もよく使う。',
      trap: '習った形に直して had seen と書きたくなる。書き取りは、正しい文でなく聞こえた音を。',
      use: 'If you would’ve been there, you’d get it.（その場にいたら分かるよ）' },

    // R fix: V2, "agreeing" and "a TV show" were easy to rule out; now two other jobs "Okay, guys" often does
    // why: stop teasing ← "Okay, guys" heard as calming the room; let him finish ← "Okay, guys" heard as asking for
    //   quiet
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'glance', seg: [66, 69.1],
      stem: 'When a coworker starts with “Okay, guys”, what is going on?',
      choices: ['Doubting that the look meant anything', 'Telling the others to stop teasing Oscar',
                'Asking the others to let Oscar finish'], a: 0,
      cue: '「not every」のあとの語。',
      line: 'Okay, guys, *not every glance means something*. All right?',
      said: '「みんな、目が合うたびに意味があるわけじゃない。いい？」と止める。',
      mean: 'not every ＝ 全部が〜とは限らない。盛り上がりに水を差している。',
      trap: 'Okay, guys を場をなだめる合図とだけ取りやすい。直後の not every が反論の中身。',
      use: 'Not every email needs a reply.（すべてのメールに返事が要るわけじゃない）' },

    // R fix: V2, "asks about Oscar" was weak; now "gets hit on too", which Oscar's theory predicts
    // why: Oscar got it wrong ← the coworker's doubt ("not every glance") taken as what the senator says; hit on
    //   too ← getting a cell number is what Oscar called flirting
    { id: 'g1', skill: 'gist', level: 'B1', point: 'test', reveals: ['bet', 'office'], seg: [66, 90.2],
      stem: 'What happens when a coworker goes to test Oscar’s theory?',
      choices: ['The coworker gets the numbers too', 'The coworker gets hit on too',
                'The coworker hears Oscar got it wrong'], a: 0,
      cue: '議員が最後に渡すものを聞く。',
      line: 'here’s my *office number and my cell number*.',
      said: '同僚が議員と話すと、議員は彼にも「いつでもどうぞ」と番号を渡す。',
      mean: '番号は誰にでも渡すらしい、という結果。オスカーの説は弱くなる。',
      trap: '同僚の疑いの言葉を議員の言葉と混ぜやすい。誰が誰に何を渡したかを追う。',
      use: 'Let me check that for myself.（自分で確かめてみる）' },

    // R fix: V2, "donors" had no basis in the clip; now "voters" (whisper's "schmoozing a voter")
    // why: won't ← "gives out" heard as a refusal; voters ← "schmoozing a voter" (whisper) just before
    { id: 'd3', skill: 'detail', level: 'B2', point: 'bet', seg: [71, 75.95],
      stem: 'What does the coworker bet before going over?',
      choices: ['The senator gives his number to everyone', 'The senator won’t give his number to him',
                'The senator gives his number only to voters'], a: 0,
      cue: '「I guarantee you」のあと、最後の一語。',
      line: 'I guarantee you he *gives out* his cell phone *to everybody*.',
      said: '「話してくる。絶対、誰にでも携帯番号を配ってるよ」。',
      mean: 'give out ＝ 配る。誰にでも渡すなら、特別な意味はないという主張。',
      trap: 'out を否定のように聞くと逆になる。最後の to everybody が要点。',
      use: 'They give out free samples here.（ここで試供品を配ってるよ）' },

    // R fix: V2, "a job opening" was a filler; now "open" as open-minded
    // why: unlocked ← "door is always open" read literally; open-minded ← "open" heard as open to views
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'door', seg: [75.7, 79.4],
      stem: 'What does the senator mean about his door?',
      choices: ['He’s glad to talk any time', 'He’s open to other views',
                'His office is never locked'], a: 0,
      cue: '「some more」のあと。',
      line: 'If you would like to talk about this some more, *my door is always open*.',
      said: '「この件をもっと話したければ、いつでも歓迎だよ」。',
      mean: 'my door is always open ＝ いつでも相談に来て。上司や政治家の決まり文句。',
      trap: 'door を文字通り取ると鍵の話になる。この言い方は気軽に話せるという意味。',
      use: 'Any questions, my door is always open.（質問があればいつでもどうぞ）' },

    // R fix: V2, the key was the only two-part choice; a second two-part choice (home) now competes
    // why: office only ← "office number" comes first; cell only ← Oscar got the cell, so it sounds like a repeat;
    //   home ← "office" caught and the second number lost
    { id: 'd4', skill: 'detail', level: 'B1', point: 'office', seg: [79.1, 82.6],
      stem: 'Which numbers does the senator give the coworker?',
      choices: ['His office and cell numbers', 'His office and home numbers', 'Only his office number',
                'Only his cell number'], a: 0,
      cue: '「here’s my」のあと、つながる二つ。',
      line: 'So here’s my *office number and my cell number*.',
      said: '「はい、これが事務所の番号と携帯の番号」と渡す。',
      mean: '二つとも渡している。オスカーにだけ特別、ではなさそうに見える。',
      trap: '最初の office だけで止まりやすい。and のあとにもう一つ続く。',
      use: 'Here’s my office and cell number.（事務所と携帯の番号です）' },

    // why: politics ← the coworker's earlier verdict ("just the issues"); tell Angela ← "I just feel so bad for
    //   Angela" heard as a plan
    { id: 'g2', skill: 'gist', level: 'C1', point: 'ending', reveals: ['call', 'poor'], seg: [83.3, 120.3],
      stem: 'By the end of the clip, what does Oscar believe?',
      choices: ['That the senator is interested after all', 'That it really was just politics',
                'That he must tell Angela the truth'], a: 0,
      cue: '最後の別れぎわの一言と、そのあとの独り言。',
      line: 'And don’t forget to call. … *Why does this always happen to me?*',
      said: '「政策の話だけ」のあと、別れぎわの「電話忘れないで」で「どうしていつも僕に」とこぼす。',
      mean: 'this は口説かれること。オスカーはまた「やっぱり好かれている」と思っている。',
      trap: '途中の「政策の話だけ」で止めやすい。最後の this が何を指すかを聞く。',
      use: 'Why does this always happen to me?（なんでいつも私ばっかり）' },

    // R fix: V2, the distractors were weak; now flirting-with-everyone (from the shared numbers) and a cynical
    //   reading of "the issues"
    // why: everyone ← both got numbers, so he flirts with all; only votes ← "the issues" heard as a political dodge
    { id: 'i1', skill: 'infer', level: 'B2', point: 'issues', reveals: ['office'], seg: [83.3, 87.85],
      stem: 'What does the coworker conclude after talking to the senator?',
      choices: ['The senator wasn’t flirting with Oscar', 'The senator was flirting with everyone',
                'The senator only cares about winning votes'], a: 0,
      cue: '「looks like he really did just」のあと。',
      line: 'looks like he really did *just want to talk about the issues*. I’m sorry, Oscar.',
      said: '「本当に政策の話がしたかっただけみたい。ごめんね、オスカー」。',
      mean: 'really did just ＝ 本当にそれだけ。口説きではなかった、という結論。',
      trap: '番号を皆に渡す＝皆を口説く、と取りやすい。really did just は「それだけ」。',
      use: 'Looks like it really was just a mistake.（本当にただのミスだったみたい）' },

    // R fix: S4, the seg held only the denial, so the letdown wasn't in it; now it runs to "certainly not
    //   disappointed". V2: "snapping" was a filler
    // why: truly fine ← "nothing to be sorry about" taken at face value; a joke ← the coworker's "I'm sorry" heard as
    //   teasing
    { id: 't2', skill: 'attitude', level: 'C1', point: 'sorry', seg: [86.4, 95.05],
      stem: 'How does Oscar answer the coworker’s “I’m sorry”?',
      choices: ['Waving it off to hide his letdown', 'Waving it off since he truly isn’t hurt',
                'Treating it as a joke at his expense'], a: 0,
      cue: '「sorry about what?」の速さと、続く言い方。',
      line: 'No, *sorry about what*? There’s nothing to be sorry about here. No, I’m *certainly not disappointed*…',
      said: '「いや、何を謝るの？謝ることなんて何もないよ」とすぐ打ち消す。',
      mean: '聞かれてもいない「がっかりしてない」まで足す。打ち消しを重ねるほど本音が見える。',
      trap: '言葉どおり「平気」と取りやすい。聞かれる前から否定を重ねたら、隠したい気持ちがある。',
      use: 'What? No, I’m totally fine.（え？ううん、全然平気）' },

    // R fix: V2, "gives himself away" was the only choice with a consequence; all three now have one
    // why: about Angela's husband ← "Angela's husband" heard as the subject of "monster"; general rule ← "I'd have
    //   to be a monster" heard as a judgement of anyone
    { id: 'h1', skill: 'humor', level: 'C1', point: 'monster', reveals: ['sorry', 'idhave'], seg: [90.2, 100.75],
      stem: 'Why do the last words of Oscar’s denial get a laugh?',
      choices: ['They fit Oscar himself, so the denial collapses', 'They fit Angela’s husband, so they’re an insult',
                'They fit anyone hoping for that, as a general rule'], a: 0,
      cue: '「monster」の前に付け足す二つの形容詞。',
      line: 'I’d have to be a monster to root for that. *A lonely, aging monster*.',
      said: '「がっかりしてない。そんなことを願うのは怪物だけ。孤独で、年をとった怪物」。',
      mean: '付け足した「孤独で年をとった」はオスカー自身の姿。否定が自白に変わる。',
      trap: '怪物を一般論と取りやすい。付け足しの言葉が誰に当てはまるかを聞く。',
      use: 'Not that I care. Okay, I care a little.（気にしてないよ。まあ、少しは）' },

    // R fix: V2, the key was the only two-part choice; now all three are, and the distractors differ in kind
    //   (hoping for vanity; a sincere denial)
    // why: to prove I was right ← "I'm right about the senator" earlier; sincere denial ← "certainly not
    //   disappointed" and "monster" taken at face value
    // anchor: 90.8–100.2 s “certainly not disappointed… I'd have to be a monster to root for that. A lonely, aging
    //   monster.”: the added adjectives fit the speaker, so the denial turns into an admission
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'monster', reveals: ['sorry', 'idhave'], seg: [90.2, 100.75],
      stem: 'Which plain-English version keeps what Oscar really says to the camera?',
      choices: ['“I was hoping for it, and I feel bad about that.”', '“I was hoping for it, but only to prove I was right.”',
                '“I wasn’t hoping for it; only a monster would.”'], a: 0,
      cue: '否定のあとの付け足しが、誰の姿か。',
      line: 'I’m *certainly not disappointed*… I’d have to be a monster to root for that. *A lonely, aging monster*.',
      said: '「がっかりなんかしてない。願うのは怪物だけ」と言い、「孤独で年をとった怪物」と足す。',
      mean: '最後の付け足しが自分の姿なので、否定が「実は願っていた」という告白になる。',
      trap: '最初の否定を本気と取ったり、怪物を一般論と取りやすい。強い否定に自分の姿を足したら自白。',
      use: 'I’m not jealous. Okay, maybe a little.（嫉妬してないよ。まあ、少しはね）' },

    // why: I have ← the 'd of "I'd" disappears before "have"; I'll ← a weak 'll and 'd sound alike; I had ← past
    //   tense, since the visit is over
    { id: 's1', skill: 'sound', level: 'B2', point: 'idhave', seg: [94.3, 97.5],
      stem: 'Fill the gap: “___ to be a monster to root for that.”',
      choices: ['I have', 'I’d have', 'I’ll have', 'I had'], a: 1,
      cue: '文の最初、I のすぐあとの小さな音。',
      line: '*I’d have* to be a monster to root for that.',
      said: '「そんなことを応援するなら、怪物でなきゃ」。',
      mean: 'I’d have to ＝（もしそうなら）〜でなければ。仮定の言い方。d はほぼ聞こえない。',
      trap: 'd が消えて I have に聞こえやすい。仮定の話なら I’d、今の事実なら I have。',
      use: 'I’d have to check my calendar.（予定を確認しないと）' },

    // R fix: V2, "loves being the one men want" was the only positive choice in tone; reworded so all three are
    //   plain statements
    // why: afraid Angela finds out ← "feel so bad for Angela" read as guilt and fear; tired of it ← "why does this
    //   always happen" read as a sincere complaint (the sincerity flip)
    // anchor: 107 s “don't forget to call”, then 113.7–119.4 s “Why does this always happen to me? I just feel so
    //   bad for Angela”: “always” makes being wanted a habit he names himself, and nothing has happened to fear
    // seg 16.1 s: the anchor needs the goodbye and the closing line (native-level §2: ≤ 25 s)
    // retired: shares g2's point (each reveals the other), so play 3+ under g2 drew no C2
    { id: 'nt3', skill: 'attitude', level: 'C2', point: 'poor', reveals: ['ending', 'call'], seg: [104.3, 120.4], retired: true,
      stem: 'In Oscar’s closing line, what is he trying not to say?',
      choices: ['That he enjoys being the one men want', 'That he’s worried Angela will find out',
                'That he’s tired of men making passes'], a: 0,
      cue: '「always」と、「Angela」のための同情の順番。',
      line: '*Why does this always happen to me?* I just *feel so bad for Angela*.',
      said: '別れぎわに「電話忘れないで」と言われたあと、「どうしていつも僕に。アンジェラが気の毒で」とこぼす。',
      mean: '「いつも」と困ったふりで、実はモテる自慢。同情の一言は、うれしさを隠すための飾り。',
      trap: '愚痴の形を本気と取りやすい。「いつも自分ばかり」と困ってみせる言い方は、自慢のことが多い。',
      use: 'Ugh, everyone keeps asking me out.（はあ、みんなに誘われて困る）' },
    { id: 'x1', skill: 'dict', level: 'B1', point: 'call', seg: [106.3, 108.4],
      stem: 'Type the parting words: “And ___.” (4 words)', answer: "don't forget to call",
      cue: '「It was lovely」のあと、And に続く4語。',
      line: 'It was lovely. And *don’t forget to call*.',
      said: '別れぎわに「楽しかった。電話、忘れないで」。',
      mean: 'don’t forget to＋動詞 ＝ 忘れずに〜して。軽い念押し。',
      trap: 'don’t の t と forget の t が弱く、「ドンフォゲッ」のように聞こえる。',
      use: 'Don’t forget to text me.（忘れずにメッセージしてね）' },

  ]
};
