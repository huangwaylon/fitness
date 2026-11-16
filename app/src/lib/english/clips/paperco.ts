// REVIEW 2026-11-16: pass 7, fix 17, drop 0, new 0; ear checks 2
// “Michael Scott's 'Sad Keanu' Moment | The Office” (the official The Office channel, BEST OF SEASON 5 - The Office
// US): the Michael Scott Paper Company's first days: an e-vite almost nobody answers, Michael griping about Pam and
// Ryan, a gloomy talking head, a pancake luncheon that goes badly, and then a luncheon guest who calls and orders.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Michael (69 s whisper only;
// "Michael Scott Paper Company" 2.8 s, 196 s), Pam (198.6 s), Ryan (121 s), Russell (201.5 s, 253.7 s). Who reads
// out the e-vite numbers (20–46 s) is never named, so stems say "the speaker".
// Untested: 47–61 s (the desktop photo: "naked pictures", "Jasmine's boobs", "you could be hot too"; skipped for
// content), 72–75 s ("P is being a giant B"), 85–95 s (the copier fight: voices over each other, and whisper adds
// "Go make the copies, Secretary" that the captions lack), 120.5–121 s ("sticky", whisper only), 153 s ("I'll take
// them" vs "I'm taking"), 200–216 s (whisper's timings drift here and it repeats 216–235 s; "Go and tell them" /
// "Don't tell them we have free delivery", "We already offer free delivery" are whisper only, the captions have
// "we're free delivery"), 254–256 s (whisper "Yes! I made a sale!", captions "yes I failed"), 285–294 s (whisper
// "Oh, I went to the bathroom", captions blank), 296 s on (whisper loops "I think it's a good job").
// EAR CHECK: 262.0–263.4 s s1 — "Who would have thought" (both sources write "would"); s1 now offers "’d have" too:
//   is the "would" really there, not "Who'd have"? If it's "who'd", make "’d have" the key.
// EAR CHECK: 135.2–136.2 s h4 — whisper "I'll do you one better", captions "I'll do you want better"; the key needs
//   "one better"
import type { Clip } from '../types.ts';

    // R fix: V2 (blind 65 %, cold 60 %): "a lot of regulars" was a filler. Now "ready for a rush of customers" ("I've
    //   done absolutely everything… to prepare" read as confidence).
export const paperco: Clip = {
  id: 'paperco', video: 'mywMUBxoLrY', title: "Michael Scott's 'Sad Keanu' Moment", dur: 318, wpm: 170, band: 'fast',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: a rush ← "I've done absolutely everything you can do to prepare" heard as expecting crowds; about to close
    //   ← "wait and hope" heard as a last hope
    { id: 'i2', skill: 'infer', level: 'B2', point: 'luncheon', seg: [16.3, 24.8],
      stem: 'What does the plan for the day suggest about the business so far?',
      choices: ['It has hardly any customers yet', 'It is ready for a rush of customers', 'It is about to close for good'], a: 0,
      cue: 'What should we do now? への答え。',
      line: 'We *wait and hope that people show up* to the pancake luncheon.',
      said: '「さて、どうする？」に「パンケーキの会に人が来るのを待って祈るだけ」と答える。',
      mean: '客が来るかどうかも分からない、始まったばかりの会社だと分かる。',
      trap: 'hope を最後の望み、準備万端を自信と取りやすい。show up ＝ 来る。',
      use: 'Let’s wait and see who shows up.（誰が来るか待ってみよう）' },

    // why: one ← "one maybe" is said just before; six ← "six yeses" opens the list (numbers bound to the wrong answer)
    { id: 'n1', skill: 'number', level: 'B1', point: 'noes', reveals: ['viewed'], seg: [29.3, 38.5],
      stem: 'How many people said no to the invitation?',
      choices: ['One', 'Six', 'Eleven'], a: 2, keep: true,
      cue: 'yeses、maybe に続く三つめ。',
      line: 'Six yeses, one maybe, *only 11 noes*.',
      said: '招待の返事を「参加6人、未定1人、不参加はたった11人」と言う。',
      mean: 'only を付けて、少ないと良いことのように言っている。',
      trap: '数が続けて出るので、聞いた数を別の答えに結びつけやすい。数のあとの yes や no と対で聞く。',
      use: 'Two yeses and one maybe so far.（今のところ参加2人、未定1人）' },

    // R fix: V2 (blind 55 %, cold 55 %): "as a joke" was far off. Now "hopeful, and they do show growing interest":
    //   the frame right, the spin believed (sincerity flip).
    // anchor: 36.5 s "only 11 noes" (only = few, said as a plus); 42.5–46.1 s "but of that group, 782 have viewed it"
    //   (but + a big number, said as good news); the numbers themselves: 6 yeses against 782 who saw it and didn't answer
    // why: bad news ← "only 11 noes" heard without "only", so the speaker seems glum (direction flip); growing
    //   interest ← "782 have viewed it" taken on the speaker's terms (sincerity flip)
    { id: 'c3', skill: 'infer', level: 'C2', point: 'viewed', seg: [29.3, 46.7],
      stem: 'How does the speaker frame the invite numbers, against what they show?',
      choices: ['As hopeful, though they show people ignoring it', 'As hopeful, and they do show growing interest',
                'As bad news, though they show real interest'], a: 0,
      cue: 'only と but の使い方と、数そのもの。',
      line: 'Six yeses, one maybe, *only* 11 noes. … *but* of that group, 782 have viewed it.',
      said: '「不参加たった11。返事なしの788人中782人は見た」と前向きに並べる。',
      mean: 'only や but で良い知らせの形にしているが、中身は「ほぼ全員に無視された」。',
      trap: 'only を聞き落とすと、本人が落ちこんで聞こえる。言い方の向きと数字の向きを分けて聞く。',
      use: 'Look on the bright side.（いい面を見ようよ）' },

    // why: 788 ← the bigger number is said first (the last-heard number swap); 702 ← "seven… two" with "eighty" lost;
    //   82 ← "seven hundred" lost
    { id: 'n2', skill: 'number', level: 'B2', point: 'count', reveals: ['viewed'], seg: [34.3, 46.7],
      stem: 'Of those who haven’t replied, how many have viewed the invite?',
      choices: ['82', '702', '782', '788'], a: 2, keep: true,
      cue: 'but of that group のあとの数。',
      line: '*788* not yet replied, but of that group, *782 have viewed it*.',
      said: '「788人がまだ返事なし。でもそのうち782人は見てくれた」と言う。',
      mean: 'seven eighty-two と、3けたを7と82に分けて読むことが多い。',
      trap: '似た数が続くので、先に聞いた788と混ざりやすい。group のあとの数だけを聞く。',
      use: 'Seven forty-five works for me.（7時45分で大丈夫）' },

    // R fix: V2 (blind 70 %, cold 75 %) + K6 ("surely" only in a distractor): now "saw it and will answer later",
    //   the same first half with the speaker's spin.
    // why: not opened yet ← "not yet replied" heard as not yet seen (yet = まだ); will answer soon ← "but of that
    //   group… viewed it" heard as good news, the speaker's own spin; answer later ← "not yet" heard as "soon"
    { id: 'i1', skill: 'infer', level: 'C1', point: 'viewed', seg: [39.5, 46.7],
      stem: 'What do the last two numbers really show about the invite?',
      choices: ['Most people saw it and chose not to answer', 'Most people saw it and will answer later',
                'Most people haven’t had time to open it yet'], a: 0,
      cue: 'not yet replied と viewed it の差。',
      line: '788 *not yet replied*, but of that group, 782 *have viewed it*.',
      said: '返事のない788人のうち、782人は招待を開いている、と報告する。',
      mean: '見たのに返事をしない＝来る気がない。本人は前向きに言うが、数字は無視を示す。',
      trap: 'but のあとは良い知らせ、と取りやすい。数字が示すことを、言い方と分けて聞く。',
      use: 'He read my message but didn’t reply.（既読スルーされた）' },

    // R fix: V2 (blind 70 %, cold 55 %): "getting along well" was weak. Now "Badly: no customers, but the three get
    //   along" (bad for the wrong reason); the key is shorter.
    // why: no customers ← the empty e-vite just before, and "I hired my best friends" heard as a happy team; sure it
    //   will work ← "That'll show them"
    //   heard as confidence
    { id: 'g1', skill: 'gist', level: 'B2', point: 'clash', reveals: ['nerves'], seg: [61.2, 107.6],
      stem: 'How are things going inside the new company in this stretch?',
      choices: ['Badly: the three of them keep clashing', 'Badly: no customers, but the three get along',
                'Tensely, but Michael is sure it will work out'], a: 0,
      cue: '電話の相手への愚痴と、そのあとの mistake。',
      line: 'They’re *getting on my nerves*… *Maybe* the Michael Scott Paper Company *was a huge mistake*.',
      said: '母親に二人の愚痴を言い、あとで「この会社は大失敗だったかも」と言う。',
      mean: '三人だけの会社で、仲間同士がぶつかっている。',
      trap: 'best friends で仲のいい職場を想像しやすい。そのあとの this is what I get が本音。',
      use: 'This is what I get for helping.（助けたらこれだよ）' },

    // why: nervous ← nerves = 神経, and katakana ナーバス; getting on well ← "getting on" heard, the rest lost (a near
    //   phrase with the opposite meaning)
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'nerves', seg: [61.2, 64.6],
      stem: 'What is Michael telling his mom about his two staff?',
      choices: ['They are irritating him', 'They are making him nervous', 'They are getting on well with him'], a: 0,
      cue: '「They’re getting」のあと、on に続く語。',
      line: 'They’re *getting on my nerves*, Mom. Both of them.',
      said: '電話で母親に「あの二人にイライラする」とこぼす。',
      mean: 'get on someone’s nerves ＝ 人をイライラさせる。神経にさわる、に近い。',
      trap: 'nerves からナーバス（緊張）を連想しやすい。get on ＋ nerves で「イライラ」。',
      use: 'That noise is getting on my nerves.（あの音、イライラする）' },

    // R fix: V2 (blind 70 %, cold 70 %): "on purpose to hurt them" was weak. Now "they can hear his mom's side"
    //   ("hear you" with the wrong object).
    // why: on mute ← a phone call plus "we can hear you" suggests a tech mix-up; his mom's side ← "hear you" heard as
    //   the call itself being loud
    { id: 'h1', skill: 'humor', level: 'C1', point: 'initials', seg: [64.5, 72.3],
      stem: 'Why does the reply “We can hear you” get a laugh?',
      choices: ['His letter code fools no one in the room', 'They can hear his mom’s side of the call too',
                'He thought the phone call was on mute'], a: 0,
      cue: 'R と P という呼び方と、すぐ横からの声。',
      line: '*R* thinks he’s too good to be here, and *P*… — *We can hear you.*',
      said: '名前の代わりに R と P と呼んで愚痴を言うが、本人たちに「聞こえてるよ」と言われる。',
      mean: '頭文字なら分からないつもり。でも同じ部屋なので丸聞こえ。',
      trap: '電話の話なので、ミュートなど機械の話を考えやすい。R と P が誰かは、部屋の人数で分かる。',
      use: 'You know I can hear you, right?（聞こえてるって分かってるよね？）' },

    // R fix: V2 (blind 70 %, cold 70 %): the key's "own company… own company" gave it away. Now it says the same
    //   thing without the echo; "fire his friends" becomes "join a bigger paper company".
    // why: go back ← "I should leave" heard as quitting to go back somewhere; a bigger company ← "paper company" caught,
    //   "start my own" lost
    { id: 'h3', skill: 'humor', level: 'C1', point: 'ownco', seg: [94.9, 107.6],
      stem: 'Why is Michael’s plan to “show them” funny?',
      choices: ['His new plan is the very thing he already has', 'He’d go back to the job he left to start this one',
                'He’d run off to join a bigger paper company'], a: 0,
      cue: '「I should leave」のあと、何を始めるか。',
      line: 'Maybe the Michael Scott Paper Company was a huge mistake. *I should leave*. I should go and *start my own paper company*.',
      said: '「この会社は失敗だったかも。辞めて、自分の紙の会社を始めよう」と言う。',
      mean: '今いるのがまさに自分の紙の会社。すねて同じことをやり直そうとしている。',
      trap: 'leave を「元の職場に戻る」と取りやすい。leave のあとに何を始めると言ったかを聞く。',
      use: 'Fine. I’ll just do it myself.（いいよ。自分でやるから）' },

    // R fix: V2 (blind 70 %, cold 55 %): "see the office" was a filler. Now "make them proud of him" (show = impress,
    //   the wrong direction).
    // why: proud of him ← show heard as "show them what I can do", in a good way; prove it works ← show as
    //   "demonstrate", though he means to leave the company
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'showthem', reveals: ['ownco'], seg: [101.8, 107.6],
      stem: 'What does Michael mean with his last three words?',
      choices: ['That would teach them a lesson', 'That would make them proud of him', 'That would prove the company works'], a: 0,
      cue: '自分の会社を始める、のすぐあと。',
      line: 'I should go and start my own paper company. *That’ll show them*.',
      said: '「自分の紙の会社を始めてやる。思い知らせてやる」と言う。',
      mean: 'That’ll show them ＝「これで思い知るだろう」。見返してやる、という負けおしみ。',
      trap: 'show を「見せる」「認めさせる」と取りやすい。すねた場面なら「思い知らせる」。',
      use: 'I’ll finish first. That’ll show them.（一番に終わらせる。見返してやる）' },

    // R fix: V2 (blind 35 %, cold 55 %): "go well with each other" can't be told from the key by sound (the
    //   captions even write "complementary"), only by sense. Now "good for your health": nutritious, the point before.
    // why: a compliment ← compliment = ほめ言葉, the same root; health ← "nutritious", the selling point just before
    //   (the last-heard word)
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'free', seg: [108.4, 116.8],
      stem: 'What does Michael’s last selling point about the pancakes mean?',
      choices: ['They cost you nothing at all', 'They come with a compliment', 'They are good for your health'], a: 0,
      cue: 'delicious、nutritious に続く三つめ。',
      line: 'They are delicious. They are nutritious. They are *complimentary*.',
      said: '「おいしい、栄養満点、しかも無料」と呼びこむ。',
      mean: 'complimentary ＝ 無料の。ホテルや機内でよく聞く。free の言いかえ。',
      trap: '同じ音の compliment（ほめ言葉）系と混ざりやすい。サービスの場なら「無料」。',
      use: 'Is breakfast complimentary?（朝食は無料ですか）' },

    // R fix: V2 (blind 70 %, cold 70 %): "glad to take one" was a filler. Now "politely declines; he's on a call"
    //   (the 遠慮 frame, and the phone).
    // why: shy ← he keeps to his phone, which can look like nerves in a crowd; politely on a call ← a short refusal
    //   read as 遠慮, and the phone as a call
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'texting', seg: [116.8, 124.1],
      stem: 'When Michael offers Ryan a pancake, how does Ryan respond?',
      choices: ['He can’t be bothered; he’s busy texting', 'He’s too shy to talk to the guests',
                'He politely declines; he’s on a call'], a: 0,
      cue: '「free pancake?」への短い返事。',
      line: 'Young sir, would you like a free pancake? — *I’m texting.*',
      said: '「パンケーキいかが？」に、Ryan は「メール中」とだけ返す。',
      mean: '断る理由にもならない一言で、やる気のなさが出ている。Michael はすぐ叱る。',
      trap: '短い返事を照れや遠慮と取りやすい。そのあと Michael が何を叱るかで態度が分かる。',
      use: 'Sorry, I’m kind of busy right now.（ごめん、今ちょっと忙しい）' },

    // R fix: V2 (blind 60 %, cold 55 %): "in charge" was weak. Now "cheering him up with a kind compliment" (the
    //   praise form taken at face value).
    // why: best-looking ← face = 顔, so "the face" heard as looks (literal reading); cheering up ← the line has the
    //   form of praise
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'face', seg: [120.5, 126.8],
      stem: 'When Michael calls Ryan the company’s face, what is he doing?',
      choices: ['Pushing him to look and act the part', 'Praising him as the best-looking of them',
                'Cheering him up with a kind compliment'], a: 0,
      cue: '「Tuck in your shirt」のあとの一言。',
      line: 'Enough with the texting machine… *Tuck in your shirt*. *You’re the face of this company*.',
      said: '「シャツを入れろ。君はこの会社の顔なんだ」と言う。',
      mean: 'the face of ＝ 外に向けた代表、看板。ほめ言葉の形で、ちゃんとしろと注意している。',
      trap: 'face を「顔立ち」と取ると、見た目をほめる話に聞こえる。直前の注意とつなげて聞く。',
      use: 'You’re the face of the team now.（今は君がチームの顔だよ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'name', seg: [126.6, 130.3],
      stem: 'Type the end: “We’re small, but we’re eager to ___.” (5 words)',
      answer: 'make a name for ourselves',
      cue: 'eager to のあと、つながる5語。',
      line: 'We’re small, but we’re eager to *make a name for ourselves*.',
      said: '「小さいけど、名を上げようと張り切ってる」と客に言う。',
      mean: 'make a name for oneself ＝ 名を上げる。make‿a、name‿for がつながる。',
      trap: 'a と for は弱く、ほとんど聞こえない。決まった形で補う。',
      use: 'She made a name for herself in Tokyo.（彼女は東京で名を上げた）' },

    // R fix: V2 (blind 70 %, cold 75 %): "a pancake instead" was weak, and the key was longest. Shorter key; "too new
    //   to have cards" and "a pancake instead of a card".
    // why: too new ← "I don't have a card" heard as an honest excuse; a pancake instead ← it's a pancake luncheon, so
    //   that swap seems natural
    { id: 'h4', skill: 'humor', level: 'C1', point: 'card', seg: [130.6, 139.4], retired: true,
      stem: 'Why does the answer to “Do you have a card?” get a laugh?',
      choices: ['He promises better, then hands over scrap paper', 'He admits the company is too new to have cards',
                'He hands the guest a pancake instead of a card'], a: 0,
      cue: '「I’ll do you」のあとと、出てくる物。',
      line: 'I don’t have a card, but *I’ll do you one better*. *A little scrap of paper*.',
      said: '「名刺はないけど、もっといいものを」と言って、紙の切れはしを出す。',
      mean: 'do you one better ＝ もっといいものを。期待させて格下の物を出す。',
      trap: '名刺がない理由の話と取りやすい。better と言ったあとに何を出したかを聞く。',
      use: 'I can do you one better.（もっといいのがあるよ）' },

    // why: too thin ← "shaped like paper" heard as about thickness, not shape; cold ← "terrible" comes before any
    //   reason, and a cold pancake is the usual complaint
    { id: 'd1', skill: 'detail', level: 'B2', point: 'shape', seg: [142.2, 149.8],
      stem: 'What is wrong with the pancakes, according to the guest?',
      choices: ['They aren’t round, so they cook unevenly', 'They are too thin, almost like paper',
                'They are cold, since they were made early'], a: 0,
      cue: '「in a circle」のあとの理由。',
      line: 'You gotta *make them in a circle so that they cook evenly*. — They’re *shaped like paper*.',
      said: '「丸く焼かないと均一に焼けない」と言われ、「紙の形なんだ」と返す。',
      mean: '紙の会社だからパンケーキも紙の形。こだわりのせいで、焼けむらができている。',
      trap: 'paper から「薄い」を思いやすい。shaped like は形の話。',
      use: 'It’s shaped like a heart.（ハートの形をしている）' },

    // R fix: S3: the cue had "real", a word only the key has; it now points at the dream and the next day.
    // anchor: 169–177 s "I once had a dream… it was delicious", 182.5–187.2 s "in real life, it is disgusting. It is a
    //   disgusting sandwich", 188.8–190.4 s "the reason I tell you this story": dream against real life, told about his
    //   day (and at 95–99 s: "Maybe the Michael Scott Paper Company was a huge mistake")
    // why: pays off ← he did act on the dream the next day, heard as the lesson (right target, wrong direction); odd
    //   combinations ← "it was delicious" is the most stressed word, heard as the verdict
    { id: 'c1', skill: 'infer', level: 'C2', point: 'dream', seg: [168.4, 191.8],
      stem: 'Where was Michael’s sandwich story heading before the phone cut in?',
      choices: ['His dream company may turn out awful for real', 'Following a dream pays off, so he’ll keep going',
                'Odd combinations can turn out to be delicious'], a: 0,
      cue: 'dream の話と、翌日の話の対比。',
      line: 'I once had a *dream*… it was delicious… And *in real life*, it is *disgusting*. … the reason I tell you this story…',
      said: '「夢のサンドはおいしかったが、作ったらまずかった。この話は…」で電話が鳴る。',
      mean: '夢と現実の対比は、夢見た自分の会社への前ふり。言われない教訓は「夢は現実では最悪かも」。',
      trap: '最後まで聞けないので、強い delicious に引っぱられやすい。in real life の側が結論。',
      use: 'It sounded better in my head.（頭の中ではもっと良かったんだけど）' },

    // R fix: V2 (blind 60 %, cold 65 %): "at the luncheon itself" was weak. Now "Michael calls a luncheon guest" (who
    //   called whom: "Pick up the phone", "Oh, hi, Russell").
    // why: Michael calls ← Michael is the boss and talks first ("Pick up the phone"); Ryan's client ← he
    //   was texting all through the luncheon
    { id: 'g2', skill: 'gist', level: 'B1', point: 'sale', reveals: ['boxes'], seg: [195.5, 268.3],
      stem: 'How does the company finally get some business?',
      choices: ['A luncheon guest calls back and places an order', 'Michael calls a luncheon guest and talks him into it',
                'Ryan brings in a client he’s been texting'], a: 0,
      cue: '電話の相手の名乗り方と、注文の中身。',
      line: 'Oh, hi, *Russell from the pancake luncheon*… I can do *20 boxes*…',
      said: 'パンケーキの会に来た Russell から電話があり、Pam が紙を20箱売る。',
      mean: '会では空振りだったが、あとで客が電話をくれた。',
      trap: 'こちらから売りこんだと考えやすい。Pick up the phone で、相手からの電話と分かる。',
      use: 'Thanks for calling back.（折り返しありがとう）' },

    // why: a lower price ← "20 boxes at $43" comes soon after, heard as the offer; pancakes ← "free" + the pancake
    //   luncheon (keyword trap)
    { id: 'd2', skill: 'detail', level: 'B1', point: 'delivery', seg: [216.5, 220.9],
      stem: 'What does Pam offer the caller to win the order?',
      choices: ['Free delivery on orders placed today', 'A lower price on a big order of paper',
                'Free pancakes with every order today'], a: 0,
      cue: '「I can offer you」のあと。',
      line: 'I can offer you *free delivery* on any order…',
      said: '「今日のご注文はすべて配送無料にできます」と持ちかける。',
      mean: '電話の客を逃がさないための特典。free delivery ＝ 配送料無料。',
      trap: 'free が聞こえると、今日の主役のパンケーキを思いやすい。free のあとの名詞を聞く。',
      use: 'Is delivery free?（配送は無料ですか）' },

    // why: $20 ← "20 boxes" said in the same breath; $34 ← forty-three heard with the digits swapped
    { id: 'n3', skill: 'number', level: 'B1', point: 'boxes', seg: [228.3, 232],
      stem: 'What price per box does Pam offer?',
      choices: ['$20', '$34', '$43'], a: 2, keep: true,
      cue: '「20 boxes at」のあとの金額。',
      line: 'I can do *20 boxes at $43 a box*.',
      said: '「20箱を1箱43ドルでお出しできます」と言う。',
      mean: 'at ＋値段＋ a box ＝ 1箱あたりいくら。forty の t は弱く「フォーリー」に近い。',
      trap: '20と43が同じ文に出るので入れかわりやすい。at のあとが値段、と覚えておく。',
      use: 'It’s ten dollars a box.（1箱10ドルです）' },

    // R fix: V2 (blind 60 %, cold 75 %): "taking back" was weak. Now "stalling while she works out the price" (her
    //   "Just a second" before the price).
    // why: money-back ← guarantee = 保証, which often means a refund; stalling ← she said "just a second" over the
    //   price a moment earlier
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'guarantee', seg: [239.4, 250.2],
      stem: 'What is Pam doing as she keeps repeating one promise word?',
      choices: ['Piling on reassurance to close the sale', 'Offering a money-back deal on the order',
                'Stalling while she works out the price'], a: 0,
      cue: '同じ語を何回言うか、その中身。',
      line: 'I *guarantee* that you will be satisfied. ’Cause your satisfaction is our *guarantee*. We *guarantee* it.',
      said: '「ご満足を保証します。ご満足こそ保証です。保証します」と重ねる。',
      mean: '中身のない約束をくり返して、安心させて契約を決めようとしている。言うほど意味が薄れる。',
      trap: '返金保証や時間かせぎと取りやすい。値段はもう決まった。中身のないくり返しは押しの合図。',
      use: 'I promise, you won’t regret it.（約束する、後悔しないよ）' },

    // R fix: V2 (blind 85 %, cold 60 %): "wouldn't have" was weak beside a set phrase. Now "’d have" (Who'd have
    //   thought), so the full "would" has to be heard. Ear check rewritten for it.
    // why: could have ← "woulda" and "coulda" differ only in the first sound, and the w is weak; ’d have ← "Who'd
    //   have thought" is the same phrase, and a weak "would" sounds close to it
    { id: 's1', skill: 'sound', level: 'B2', point: 'thought', seg: [261.5, 268.3],
      stem: 'Fill the gap: “Who ___ thought that the thing that would save this company…”',
      choices: ['would have', '’d have', 'could have'], a: 0,
      cue: 'Who のすぐあと、弱く短い2音。',
      line: '*Who would have thought* that the thing that would save this company would be work and pancakes?',
      said: '「会社を救うのが仕事とパンケーキとは」。',
      mean: 'Who would have thought ＝ まさか。would have は「ウダ」に近い。',
      trap: 'could は「ク」の息が出る。Who’d なら Who に d が付くだけで、ウがもう一つ来ない。',
      use: 'Who would’ve thought it’d rain today?（今日雨なんて誰が思った？）' },

    // R fix: V2 (blind 55 %, cold 65 %): "room to grow" was weak. Now "proud of the office, despite a rough day"
    //   (right feeling, wrong object).
    // why: ready to give up ← "ups and downs" and "don't have the biggest office" heard as the main point; proud of
    //   the office ← "sounds like a lot" heard as a boast about the space
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'hearts', seg: [269.1, 284.1],
      stem: 'How does Michael feel about his company at the end of the day?',
      choices: ['Proud of his people, despite the small office', 'Proud of the office, despite a rough day',
                'Ashamed of the office, and ready to give up'], a: 0,
      cue: '「But we have」のあと。',
      line: 'this day definitely had its *ups and downs*… *But we have people with the biggest hearts*.',
      said: '「いい時も悪い時もあった。事務所は狭いけど、いちばん大きな心の仲間がいる」と言う。',
      mean: 'but のあとが言いたいこと。狭さを認めたうえで、仲間を誇っている。',
      trap: '前半の downs や狭さの話を結論と取りやすい。but のあとに本音が来る。',
      use: 'We had our ups and downs.（いろいろあったよ）' },

    // R fix: V2 (blind 55 %, cold 70 %): "the staff" was weak. Now "Michael, for choosing such a tiny room" (right
    //   target, wrong reason), so the "because… sounds like a lot" has to be heard.
    // anchor: 273.8–280.6 s "which is a surprise because 165 square feet sounds like a lot": the surprise is his own
    //   ("I realized"), and the reason he gives is that the number sounded big to him
    // why: tiny room ← "we don't have the biggest office" heard as the joke itself; landlords ← "sounds like
    //   a lot" heard as a jab at how rooms are sold (right mechanism, wrong target)
    { id: 'c2', skill: 'humor', level: 'C2', point: 'office', seg: [272.85, 281.4],
      stem: 'In the remark about 165 square feet, who is the joke on?',
      choices: ['Michael, who thought the number meant a big room', 'Michael, for choosing such a tiny room to rent',
                'Landlords, who make tiny rooms sound huge'], a: 0,
      cue: '「a surprise because」のあとの理由。',
      line: 'we don’t have the biggest office, *which is a surprise because 165 square feet sounds like a lot*.',
      said: '「事務所は一番広くはない。165平方フィートは広く聞こえるから意外だ」と言う。',
      mean: '数字だけで広いと思いこんでいたと、本人が真顔で明かす。笑われているのは話し手。',
      trap: '広さの不満や、だれかへの皮肉と聞きやすい。surprise の主を聞くと、思いこんでいたのは本人。',
      use: 'It sounded bigger on the phone.（電話ではもっと大きく聞こえた）' },
  ]
};
