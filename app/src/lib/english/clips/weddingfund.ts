// REVIEW 2026-11-16: pass 5, fix 14, drop 1, new 0; ear checks 1
// Open question: nt1's notes assume “Clearly I did not start drinking enough…” (54.4 s) is Chandler's; confirm by ear.
// “Monica's Parents Spent All of Her Wedding Money | Friends” (the official Friends channel, Best of Season 7): at
// dinner Monica brings up the wedding fund, and her parents explain, one excuse at a time, that it became the beach
// house, that the second savings became a kitchen, and that the rest went on her father's plan to sell ice online.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 75 s. Her mother is placed by her own
// words (“your father”, 61.5 s) and her father by her reply to him (“Stupid, Jack”, 68.1 s). Untested on purpose:
// 11–13.6 s (captions “what you tell Jack I can't do it”, whisper “what you told jack”: who says what is unclear),
// 57–60 s (Monica's “I can't believe… no money”: captions start at “money”), 73.8 s (who says “Good luck, Chandler”).
// EAR CHECK: 54.4 s nt1 — “Clearly I did not start drinking enough…” taken as Chandler's (no name is said; whisper
//   has “clearly”, the captions start at “I”); the key rests on “it was Chandler”, the wince only confirms it
import type { Clip } from '../types.ts';

export const weddingFund: Clip = {
  id: 'weddingfund', video: 'R-OG-Lp9DHc', title: 'Monica\'s Parents Spent All of Her Wedding Money', dur: 89, wpm: 156,
  band: 'mid', tags: ['家', '恋愛'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // why: how much ← "big withdrawal" heard as a question about the amount; cost a lot ← "big" taken as the price of
    //   the wedding, said as a warning
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'withdraw', seg: [0, 6.1],
      stem: 'At the start, how does Monica bring up the money?',
      choices: ['Announcing, lightly, that they’ll want it soon', 'Asking, politely, how much is in the fund',
                'Warning, gently, that the wedding will cost a lot'], a: 0,
      cue: '「wedding plans」のあと、I guess で始まる部分。',
      line: 'I guess pretty soon *we’ll be making a big withdrawal* from the Monica wedding fund.',
      said: '「そろそろ結婚資金から大きく引き出すことになるかな」と言う。',
      mean: '銀行の言い方を借りた、軽い「お金をお願いね」。I guess で頼みを柔らかくしている。',
      trap: 'big を金額や費用の質問と取りやすい。聞いているのでなく、これからの予定として伝えている。',
      use: 'I guess I’ll be needing a ride soon.（そろそろ車で送ってもらうことになるかな）' },

    // why: pay back ← "I really do feel bad" and "we might still have some money" heard as making amends; Chandler ←
    //   "you'd pay for it yourself" plus "Good luck, Chandler" at the end heard as the groom paying
    // R fix: V2/K6 — the key was the only nuanced choice ("more than"); all three now read "They say sorry, then…"
    { id: 'g1', skill: 'gist', level: 'B2', point: 'excuses', seg: [11, 73],
      stem: 'Across the whole talk, how do her parents handle what they did?',
      choices: ['They say sorry, then keep making excuses', 'They say sorry, then promise to pay it back',
                'They say sorry, then say Chandler should pay'], a: 0,
      cue: '謝る言葉と、そのあとに続く説明の量。',
      said: 'お金の行き先を聞かれるたびに、両親は理由や言い訳を重ねていく。',
      mean: '「悪いとは思う」とは言うが、話の中心は事情の説明。返す話は一度も出ない。',
      trap: 'feel bad や some money から「返す気がある」と取りやすい。謝罪のあとに続く話を聞く。',
      use: 'I feel bad, but here’s what happened.（悪いとは思うけど、事情はこう）' },

    // why: kitchen ← the second savings, spent later in the talk; business ← the father's plan blamed at the end
    // R fix: N7/B1 — the third choice named d3's key ("selling ice" online); now "Her father's business idea"
    { id: 'd1', skill: 'detail', level: 'B1', point: 'beach', seg: [13.1, 19.6],
      stem: 'When Monica asks about the wedding fund, what has it become?',
      choices: ['The family’s beach house', 'The family’s new kitchen', 'Her father’s business idea'], a: 0,
      cue: '「only now we call it」のあと。',
      line: 'We have it, only now we call it *the beach house*.',
      said: '「あるよ。ただ今は『ビーチハウス』と呼んでるけど」と答える。',
      mean: '結婚資金で別荘を買ってしまった、という意味。今はお金ではなく家になっている。',
      trap: 'kitchen も父の商売も出てくるが、それは後の話。最初の資金の行き先はこの一言。',
      use: 'We still have it, sort of.（一応、まだあるよ）' },

    // why: gift ← "we have it" heard as the fund still being there for her, in house form; meant for a house ← "the
    //   beach house" heard as the fund's plan from the start (it was the "Monica wedding fund")
    // R fix: V2/K5 — the key was the only choice about the wording; all three now read "It claims…"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'beach', seg: [13.1, 20.5],
      stem: 'Why does the answer about the fund get a laugh?',
      choices: ['It claims money they spent is still there', 'It claims the house was her wedding gift',
                'It claims the fund was always for a house'], a: 0,
      cue: '「We have it」と、そのあとの「only now」。',
      line: '*We have it*, only now *we call it* the beach house.',
      said: '「資金はあるよ、今はビーチハウスと呼んでるだけ」と言う。',
      mean: '使い切ったことを「呼び名が変わっただけ」と言い換える。言い逃れの形が笑い。',
      trap: 'We have it を「まだある」と取ると、家が贈り物に聞こえる。only のあとで中身が変わる。',
      use: 'It’s not gone. It’s a boat now.（なくなってない。今はボートなだけ）' },

    // why: you'll ← the d is swallowed by the p, leaving "you", and will feels natural for a plan; you ← the same lost
    //   d, with the present tense
    { id: 's1', skill: 'sound', level: 'B2', point: 'youd', seg: [24, 29],
      stem: 'Fill the gap: “…after you turned 30, ___ pay for it yourself.”',
      choices: ['you', 'you’d', 'you’ll'], a: 1,
      cue: 'pay の直前、とても短い音。',
      line: 'if you got married after you turned 30, *you’d* pay for it yourself.',
      said: '「30歳を過ぎて結婚するなら、自分で払うだろうと思った」。',
      mean: 'assumed の中なので would の形。d は次の p にのまれ、ほぼ「ユッ」。',
      trap: 'd が消えると you や you’ll に聞こえる。過去の「思った」の中は would。',
      use: 'I figured you’d say that.（そう言うと思った）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'assumed', seg: [24, 29],
      stem: 'Type what she says: “We’re sorry, honey, but ___…” (3 words)', answer: 'we just assumed',
      cue: '「honey, but」のあと。3語がつながって聞こえる。',
      line: 'We’re sorry, honey, but *we just assumed*…',
      said: '「ごめんね。でも思ってたのよ」と理由を言い始める。',
      mean: 'assume ＝ 確かめずにそう思い込む。謝ったあと、すぐ言い訳に移る。',
      trap: 'just の t が消えて「ジャスタ」、assumed の d も弱い。最後の子音まで書く。',
      use: 'I just assumed you were coming.（来ると思い込んでた）' },

    // why: 30 ← "after you turned 30" just before; 33 ← twenty/thirty confused at the start; 20 ← "twenty" caught,
    //   "-three" lost
    // R fix: S1/N7 — the stem named d1's key (the beach house); it now asks about "the money", and reveals beach
    { id: 'n1', skill: 'number', level: 'B1', point: 'age23', reveals: ['beach'], seg: [24, 31.6], keep: true,
      stem: 'How old does Monica say she was when the money was spent?',
      choices: ['Twenty', 'Twenty-three', 'Thirty', 'Thirty-three'], a: 1,
      cue: 'Monica が言い返す一言の最後、年齢。',
      line: 'You bought the beach house *when I was 23*.',
      said: '「ビーチハウスを買ったのは私が23歳の時でしょ」と言い返す。',
      mean: '30歳を過ぎたら自分で払う、という理屈より、ずっと前に使っていたという指摘。',
      trap: '直前の30が耳に残りやすい。twenty と thirty は語頭の音で聞き分ける。',
      use: 'I was 23 when I moved here.（ここに来たのは23歳の時）' },

    // why: husband ← "you'd pay for it yourself" plus "Good luck, Chandler" heard as the groom's side paying (but
    //   "yourself" is Monica); before 30 ← "30" caught without "after", read as a deadline (but then they'd have kept
    //   the fund, and they spent it)
    // anchor: 24.5–28.4 s "if you got married after you turned 30, you'd pay for it yourself"; 29.1–31.1 s "You bought
    //   the beach house when I was 23"; 31.6–33.6 s "seven years": the money was spent at 23, so the bet was made then
    // R fix: V2 (C2 rewrite) — "refill" was easy to rule out; "marry before 30" is the near miss on "after you turned
    //   30". Its line names the beach house: reveals beach
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'age23', reveals: ['assumed', 'beach'], seg: [24, 36.4],
      stem: 'Set against Monica’s reply, what does the parents’ “we just assumed…” admit?',
      choices: ['Even when she was 23, they bet she’d be single at 30', 'Even when she was 23, they bet she’d marry before 30',
                'Even when she was 23, they expected her husband to pay'], a: 0,
      cue: '親の「思い込み」と、家を買った時期の差。',
      line: 'we just assumed if you got married *after you turned 30*… — You bought the beach house *when I was 23*.',
      said: '「30過ぎて結婚するなら自分で払うと思って」に、「家を買ったのは私が23の時よ」と返す。',
      mean: '23歳で使ったなら、その時もう「30まで結婚しない」と読んでいたことになる。二つの年齢が本音を明かす。',
      trap: '30 だけ拾うと「30までに結婚」と逆に取りやすい。after と使った年齢を並べる。',
      use: 'We figured you’d never move out.（どうせ家を出ないと思ってた）' },

    // why: regret ← "sweetie" heard as the soft start of an apology; wedding venue ← "beach" plus the wedding plans
    //   heard as an offer of the house
    // R fix: S1/N7 — the stem named d1's key; now "how do her parents present it?", and reveals beach
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'beachfun', reveals: ['age23', 'beach'], seg: [31.1, 36.4],
      stem: 'Right after Monica’s age remark, how do her parents present the spending?',
      choices: ['As a fun thing she got out of the deal', 'As a mistake they now deeply regret',
                'As a place she can use for the wedding'], a: 0,
      cue: '「which means」のあと、何を「得た」と言うか。',
      line: 'which means *you had seven years of beach fun*, and you can’t put a price on that, sweetie.',
      said: '「7年もビーチで楽しめた。お金に代えられないよ」と言う。',
      mean: '損をさせた話を、得をさせた話に言いかえている。謝るどころか、良い面を売りこむ。',
      trap: 'sweetie を謝る前の優しい呼びかけと取りやすい。which means のあとで話をすり替えている。',
      use: 'Look on the bright side: free parking!（いい面を見よう、駐車は無料！）' },

    // why: house worth more ← "price" taken literally, as the house's value (but "that" is the seven years of fun);
    //   rude to ask ← a Japanese frame, where talk of price is impolite, so "can't" read as "shouldn't"
    // R fix: V2 — the key was the only fitting reading of a known idiom; both distractors now turn on "price"/"can't"
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'beachfun', seg: [31.1, 36.4],
      stem: 'At the end of the reply about “seven years”, what does the closing phrase mean?',
      choices: ['The fun was worth more than money', 'The house is worth more than it cost',
                'It’s rude to ask what it all cost'], a: 0,
      cue: '「seven years」のあと、that が指すもの。',
      line: 'and *you can’t put a price on that*, sweetie.',
      said: '「7年分のビーチの楽しみは値段がつけられない」と言う。',
      mean: 'can’t put a price on ＝ お金では測れない価値がある。決まり文句。',
      trap: 'price から家の値段の話と取りやすい。that は直前の beach fun を指す。',
      use: 'You can’t put a price on sleep.（睡眠はお金に代えられない）' },

    // why: save again ← "we started saving again" heard as a promise; father ← she does blame him, but later and for
    //   the ice (61 s), not here, where it's "we redid the kitchen"
    // R fix: V2/K6 — the key was the only "yet" and the stem hinted at a turn; choices now parallel, stem neutral
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'feelbad', reveals: ['kitchen'], seg: [38.7, 46.2],
      stem: 'After “I really do feel bad about this”, how does her apology go on?',
      choices: ['It turns into news of more spending', 'It turns into a promise to save again',
                'It turns into blame for Monica’s father'], a: 0,
      cue: '「feel bad」のあと、though に続く話。',
      line: 'I *really do feel bad* about this, though. We started saving again… so *we redid the kitchen*.',
      said: '「本当に悪いと思ってる」と言ったあと、二度目の貯金もキッチンに使ったと話す。',
      mean: '謝りながら、さらに悪い知らせを足している。言葉は謝罪、中身は告白の続き。',
      trap: 'saving again を約束と取りやすいが、過去の話。-ed を聞く。',
      use: 'I feel bad about this, though.（これは悪いと思ってるんだけど）' },

    // why: Richard ← his name heard as where the money went; beach house ← the house named earlier, and "redid"
    //   sounds like fixing something already owned
    { id: 'd2', skill: 'detail', level: 'B2', point: 'kitchen', reveals: ['hell'], seg: [38.7, 46.2],
      stem: 'What happened to the money they started saving again?',
      choices: ['They spent it on a new kitchen', 'They spent it on Monica and Richard',
                'They spent it fixing the beach house'], a: 0,
      cue: '「went to hell」のあと、so に続く部分。',
      line: 'but then *that went to hell*, so *we redid the kitchen*.',
      said: '「リチャードの頃にまた貯めたけど、だめになってキッチンを改装した」。',
      mean: 'redid ＝ redo の過去形で、作り直した。二度目の貯金も結婚以外に使われた。',
      trap: 'Richard の名前が聞こえると、その人のためと思いやすい。so のあとが使い道。',
      use: 'We redid the bathroom last year.（去年お風呂を改装した）' },

    // why: worked out ← "went to hell" heard as a rough patch only (but the savings then went on a kitchen, so no
    //   wedding); far away ← "went to" heard as someone going somewhere
    // R fix: V2 — "fell apart" vs two weaker readings; all three now read "It went…, and/but…"
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'hell', seg: [40.7, 46.2],
      stem: 'What does her mother say happened with Monica and Richard?',
      choices: ['It went badly, and they split up', 'It went badly, but they worked it out',
                'He went away, so it went long-distance'], a: 0,
      cue: '「but then」のあと、that が指すもの。',
      line: 'we started saving again when you were dating Richard, but then *that went to hell*…',
      said: '「リチャードの頃にまた貯め始めたけど、ダメになって」。',
      mean: 'go to hell ＝ だめになる。ここでは恋愛が終わったこと。くだけた形。',
      trap: 'hell を一時のけんか、went to を「行った」と取りやすい。so のあとの使い道が結末を示す。',
      use: 'The plan went to hell fast.（計画はすぐにだめになった）' },

    // why: afford ← the money talk all around it; take years ← "ever" heard as "for a long time", a delay, not a never
    // R fix: V2 — "commit" matched the show's known Chandler; the near miss is now a late proposal
    { id: 'i1', skill: 'infer', level: 'B2', point: 'propose', seg: [48.3, 53],
      stem: 'What does her mother’s answer about Chandler suggest?',
      choices: ['They thought he’d never ask her to marry him', 'They thought he’d take years to ask her',
                'They thought he couldn’t afford a big wedding'], a: 0,
      cue: '「Well, it was Chandler.」の次の文。',
      line: 'Well, *it was Chandler*. We didn’t think he’d *ever propose*.',
      said: '「だってチャンドラーだもの。プロポーズするとは思わなかった」。',
      mean: '彼は結婚まで踏み切らない人だと思われていた。だから貯金もしなかった、という含み。',
      trap: '周りがお金の話なので「払えない」と取りやすい。ever は「いつか」でなく否定と組んで「一度も」。',
      use: 'I didn’t think he’d ever call.（彼が電話してくるとは思わなかった）' },

    // why: Monica ← her two relationships come up back to back, so it sounds like a jab at her track record; Richard ←
    //   "we didn't think he'd ever propose" heard as about the earlier man, since his story came just before
    // anchor: 50.3–52.4 s "Well, it was Chandler. We didn't think he'd ever propose": the name fixes the target;
    //   54.4–57.0 s the next line, "I did not start drinking enough at the start of the meal", is the target's wince
    // R fix: V2 (C2 rewrite) — the stem named Chandler; it now names the moment ("Well, …"), and Richard's choice
    //   is the near miss (they did save for him, so a listener can think "he'd ever propose" is about him)
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'propose', seg: [48.3, 57.5],
      stem: 'In her mother’s answer that starts “Well, …”, who is the joke on?',
      choices: ['Chandler, whom they never saw marrying her', 'Monica, who picks men who won’t marry her',
                'Richard, whom they once saw marrying her'], a: 0,
      cue: '「Well,」のあとの名前と、次の人の一言。',
      line: 'Well, *it was Chandler*. We didn’t think he’d ever propose. — Clearly I did not start *drinking enough*…',
      said: '「だってチャンドラーよ。プロポーズすると思わなかった」に「飲み足りない」と一言。',
      mean: 'it was Chandler で彼を名指しして笑う。「飲み足りない」は、目の前で聞かされた本人の苦笑い。',
      trap: '直前のリチャードの話から、Monica の男運の話に聞こえやすい。名前と次の「I」を追う。',
      use: 'Well, it’s Kevin. What did you expect?（だってケビンだよ。何を期待してたの）' },

    // why: sells ← "if your father" heard as an open condition, a way out still to come; tied up ← "still have some
    //   money" heard without "might… if… hadn't"
    { id: 'i2', skill: 'infer', level: 'C1', point: 'hadnt', reveals: ['ice'], seg: [57, 66.2],
      stem: 'After Monica’s complaint about money, what does her mother’s reply imply?',
      choices: ['Some would be left if he hadn’t tried his plan', 'Some will be left once he sells his ice business',
                'Some is left, but it’s tied up in his plan'], a: 0,
      cue: '「your father」の前後、動詞の形。',
      line: 'We *might still have* some money *if* your father *hadn’t* thought…',
      said: '「お父さんがあんな事を考えなければ、まだあったかも」と言う。',
      mean: 'hadn’t thought ＝ 実際は考えた。だから今はお金がない、という仮定の形。',
      trap: 'some money だけだと残りがあるように聞こえる。if…hadn’t は事実の逆。',
      use: 'If I hadn’t overslept, I’d be there.（寝坊しなければ着いてたのに）' },

    // why: sell the house ← the beach house is the money's main home, so it sounds like the fix; she and Chandler ←
    //   "you'd pay for it yourself" earlier, and "Good luck, Chandler" right after
    { id: 'g2', skill: 'gist', level: 'B1', point: 'enough', seg: [57, 73],
      stem: 'How does Monica end the talk about the money?',
      choices: ['She says she doesn’t want to hear any more', 'She asks her parents to sell the beach house',
                'She says she and Chandler will pay for it'], a: 0,
      cue: '最後の Monica の発言。誰に何を求めている？',
      line: 'All right, *enough*. I don’t want to *hear about it anymore*.',
      said: '「もういい。これ以上聞きたくない」と話を打ち切る。',
      mean: 'All right, enough. ＝ もうたくさん。返金などの話にはならず、そこで終わる。',
      trap: '直前のお金の話から解決策を期待しやすいが、出てくるのは打ち切りの言葉だけ。',
      use: 'Okay, enough. Let’s change the subject.（もういい、話を変えよう）' },
    // why: ice cream ← "ice" plus the beach house, with "cream" filled in; from the house ← "ice" plus the beach house
    //   talk all around it
    // R fix: V2 — "ice over the internet" was the only odd choice, so the key; all three now keep "ice"
    { id: 'd3', skill: 'detail', level: 'B1', point: 'ice', reveals: ['hadnt'], seg: [60.5, 66.2],
      stem: 'Which business idea of her father’s gets the blame?',
      choices: ['Selling ice over the internet', 'Selling ice cream over the internet', 'Selling ice from the beach house'],
      a: 0,
      cue: '「a good idea to」のあと。',
      line: 'if your father hadn’t thought it was a good idea to *sell ice over the internet*.',
      said: '「お父さんがネットで氷を売るなんて考えなければ」と言う。',
      mean: 'お金が消えた最後の理由。夫のおかしな商売を、娘の前ではっきり責めている。',
      trap: 'ice から「アイスクリーム」と補いやすい。cream は言っていない。聞こえた語だけで選ぶ。',
      use: 'It was a good idea on paper.（理屈の上ではいい案だった）' },

    // R drop: w1 (who says "It seemed like such a simple idea") — V1: whoever had the idea defends it, so common
    //   sense gives the key without the voices, and it needed an ear check. Never shipped, deleted.
    // why: him not the idea ← "Stupid, Jack" heard as calling Jack stupid (but "the word is" swaps his adjective for
    //   the idea); herself ← "stupid" heard without "Jack", as her blaming herself for letting him
    // R fix: V2 — the key was the only choice about words; all three now read "She says…". reveals 'simple' removed
    //   (w1 dropped)
    { id: 'h2', skill: 'humor', level: 'C1', point: 'stupid', seg: [65.4, 70],
      stem: 'Why does the line about “the word” get a laugh?',
      choices: ['She says his idea wasn’t simple but stupid', 'She says he is stupid, not his idea',
                'She says she was stupid to let him try'], a: 0,
      cue: '父の言い訳と、それに返す一語。',
      line: 'It seemed like such a *simple* idea. — *Stupid*, Jack. *The word is stupid*.',
      said: '「簡単な案だと思った」に「バカな案、でしょ」と言い直す。',
      mean: 'simple を stupid に言い直し、夫の言いわけを一語で切る。そのやりとりが笑い。',
      trap: 'Stupid の相手を聞きのがすと、自分を責めているように聞こえる。直後の Jack が相手。',
      use: 'Not “brave”. The word is “reckless”.（「勇敢」じゃない、「無謀」よ）' },

  ]
};
