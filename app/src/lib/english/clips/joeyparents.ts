// REVIEW 2026-11-17 (2nd review; earlier R fixes were from the first): pass 9, fix 9, drop 2, new 1; ear checks 3
// Open: a cold re-read (fresh subagent, no keys) still picked h1 (75 %), i1 (70 %), p1, i2 and f2 (60 %), from sitcom
//   sense and the bank's lost-mail thread. a2 and h1 lean on Joey's 46–50 s plan, which sits before their segments
//   (the learner has watched the whole clip first). Retire h1 if the phone read agrees.
// “Monica Calls Joey's Parents | Friends” (the official Friends channel, Best of Season 7): Monica has squeezed Joey's
// parents into the wedding seating, but they feel invited only for Joey's sake; Joey talks her into calling his mom,
// and she covers with his post-office excuse.
// Segments from the captions, words from whisper (2026-11-16). Only Monica's side of the call is heard after the
// “Hello” at 57.5 s. Untested: 28.2 s (captions “Look, Mon”, whisper “Mom”), 29.7 s (captions “I'll try”, whisper
// “Joey”), 41.8 s (whisper “What thing am I gonna say?”), 49.9–53.2 s and 84.8 s (the Irish lines), and 62.8–64.8 s
// (the captions' “I'm just, I'm just… uh”, not in whisper).
// EAR CHECK: 77.4 s f2 — “Tell me about it” (both sources) is Monica's, answering a complaint we don't hear
//   (captions show no speaker change; the “D-” at 77.0 s is captions only)
// EAR CHECK: 38.8–39.7 s c3 — “some of them didn't make it” (both sources): “of them” and “didn't” reduced in one breath
// EAR CHECK: 67.4–68.2 s c4 — “apparently a bunch of the invitations” (both sources): “a” and “of the” really there
import type { Clip } from '../types.ts';

export const joeyParents: Clip = {
  id: 'joeyparents', video: 'D_EP4Kbf1sQ', title: 'Monica Calls Joey\'s Parents',
  dur: 97, wpm: 162, band: 'mid', tags: ['電話', '友だち'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2/§9.4 — the title ("Monica Calls…") ruled out "Joey calls himself", and "admits the truth" was absurd,
    //   so the key was guessable. All three are now calls that blame someone; they differ in who and how it lands.
    //   The `use` no longer says "mix-up" (d3's key).
    // R fix: V2 (blind 55 %) — the key was the only choice sharing a half with each of the others (mail ×2, grumbles
    //   ×2). The caterer choice now ends "isn't buying it", so a distractor holds that middle spot.
    // why: caterer ← the other outside party, named at the start; unconvinced ← only Monica's side is heard, so the
    //   mom's reaction must be read from “Tell me about it” and the riff that follows
    { id: 'g2', skill: 'gist', level: 'B2', point: 'scene', reveals: ['postoffice', 'fake', 'tellme'], seg: [0, 86.5],
      stem: 'By the end of the clip, how is the problem handled?',
      choices: ['She blames the mail, and his mom grumbles along', 'She blames the caterer, but his mom isn’t buying it',
                'She blames the mail, but his mom isn’t buying it'], a: 0,
      cue: '後半の電話で何のせいにするか、相手の反応も。',
      said: 'Joey の母に電話し、招待状が届かなかったのは郵便局のミス、と作り話をする。',
      mean: '相手の文句に Tell me about it と同調し、話は通っている。',
      trap: 'caterer は冒頭の話。電話は片方の声だけなので、返事から相手の反応を読む。',
      use: 'Let’s just blame it on the weather.（天気のせいにしておこう）' },

    // why: two of eight ← the starting plan is said first; three of eight ← "three" caught, "eight" carried over;
    //   two of six ← the two numbers crossed
    // R fix: K8 — a number scale needs keep: true (the choices were already ascending)
    { id: 'n1', skill: 'number', level: 'B1', point: 'tables', seg: [2.3, 9.1], keep: true,
      stem: 'With Joey’s parents added, how will Monica set up the tables?',
      choices: ['Two tables of six', 'Two tables of eight', 'Three tables of six', 'Three tables of eight'], a: 2,
      cue: '「turn them into」のあと。',
      line: 'I’m going to turn them into *three tables of six*, okay?',
      said: '8人席2つに両親を足し、6人席3つに組み直す、と言っている。',
      mean: '16人に2人足すと18人。6人の席3つなら全員座れる計画。',
      trap: '最初の two tables of eight が耳に残りやすい。turn ～ into のあとが新しい形。',
      use: 'Can we get a table for six?（6人席をお願いできますか）' },

    // R drop: n2 (two extra meals) — V1/V2: common sense answers it (Joey's parents are two people), and n1's stem says
    //   the parents were added. Never shipped, so deleted; d3 replaces it as the fourth literal item.
    // R fix: V2 (blind 50 %) — "the food will taste good" was easy to set aside. Now "a good job", good read as praise.
    // why: leave ← go read literally (行く); good job ← good read as praise (よくやった) after the list of tasks done
    { id: 'f1', skill: 'phrase', level: 'B1', point: 'goodtogo', seg: [8.7, 12.6],
      stem: 'After the caterer, what does Monica mean with her last few words?',
      choices: ['Everything is ready now', 'It is time to leave now', 'We did a good job on it'], a: 0,
      cue: '「two extra meals」のあと、文の終わり。',
      line: 'we are *good to go*.',
      said: '席も食事も手配した、これで準備完了、と締めくくっている。',
      mean: 'good to go ＝ 準備ができた、いつでもOK。どこかへ出かける意味はない。',
      trap: 'go から「出かける」、good から「よくやった」と一語ずつ取りやすい。3語で一つの決まり文句。',
      use: 'Bags packed? Okay, we’re good to go.（荷物OK？じゃあ準備完了）' },

    // R fix: V2 — "hear the seating plan" and "thank her for lasagnas" were weak, so the key was guessable. Now three
    //   messages a call could carry, all built from the scene.
    // R fix: V2 (blind 60 %) — "truly" made the key the only heartfelt choice, and "a late invite" leaned on the later
    //   story. Now a plain key and an "I'm sorry you feel hurt" call, which "that's too bad" invites.
    // why: sorry ← "that's too bad" heard as sympathy, and a call after hurt feelings is expected to be an apology
    //   (Japanese frame); seating ← the tables talk opens the scene, so the call sounds like a seating update
    { id: 'g1', skill: 'gist', level: 'B2', point: 'unwanted', reveals: ['owe'], seg: [16.6, 36.6],
      stem: 'Why does Joey want Monica to call his mom?',
      choices: ['So his parents hear she wants them there', 'So his parents hear she’s sorry they feel hurt',
                'So his parents hear there are seats for them'], a: 0,
      cue: '「call my mom」のあと、何を伝えてほしいか。',
      line: 'just tell her that you *really want them to be there*.',
      said: '両親は Joey のおまけで呼ばれたと感じている。だから「本当に来てほしい」と伝えて、と頼む。',
      mean: '花嫁本人の言葉で歓迎を感じさせたい。',
      trap: '電話＝お詫びと考えやすいが、謝る話は出ない。伝える中身は tell her のあとに来る。',
      use: 'Just let her know you want her there.（来てほしいって伝えてあげて）' },

    // R fix: V2/K5 — the key was the only "invited only…" reason. All three are now "invited only…" so the reason
    //   itself must be heard.
    // R fix: V2 (blind 70 %) — Joey's own parents made "because of Joey" the obvious reason. "At the last minute" (a
    //   weak echo of the later story) becomes "a favor to Chandler", the groom and Joey's friend.
    // why: fill tables ← the table plan just before; Chandler ← the groom, named later in the call, and "because of"
    //   heard without the word after it.
    { id: 'd1', skill: 'detail', level: 'B1', point: 'unwanted', reveals: ['fake'], seg: [17.3, 23.1],
      stem: 'What idea did Joey’s parents somehow get?',
      choices: ['They were invited only because of Joey', 'They were invited only to fill up a table',
                'They were invited only as a favor to Chandler'], a: 0,
      cue: '「got the idea」のあと、that 以下。',
      line: 'they got the idea that you *only invited them because of me*.',
      said: '両親は「Joey がいるから呼ばれただけ」と思い、歓迎されていないと感じている。',
      mean: 'because of me ＝ 自分がいるから。両親自身は望まれていない、という受け取り方。',
      trap: '直前の席の話に引かれやすい。because of のあとの人を聞く。',
      use: 'Was I only invited to be nice?（気を使って呼ばれただけ？）' },

    // why: very sorry ← "too bad" taken as real sympathy (気の毒に); made it up ← "It's true" missed, so the flat
    //   reply sounds like disbelief
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'tootrue', seg: [17.3, 27.5],
      stem: 'When Monica hears why they aren’t coming, how sorry does she sound?',
      choices: ['Not very; she says their idea is right', 'Very; she is upset to have hurt them',
                'Not at all; she thinks they made it up'], a: 0,
      cue: '「too bad」のあと、短く付け足す一言。',
      line: 'Oh, that’s too bad. *It’s true*, but too bad.',
      said: '「お気の毒」と言ったあと、「その通りなんだけど、お気の毒」と付け足す。',
      mean: '両親の思い込みが当たっていると、あっさり認めている。気の毒がる言葉は形だけ。',
      trap: 'too bad を本気の同情と取りやすい。It’s true が本音。',
      use: 'Fair enough, but that’s their problem.（まあね、でもそれはあっちの問題）' },

    // R fix: V2 — "a lasagna dish for the wedding" was near-absurd. Now three aims a pushy reminder could have.
    // R fix: V2 (blind 60 %) — "cook for the wedding" was still easy to dismiss. Now a thank-you call (お礼の電話),
    //   the frame a Japanese listener brings to gifts of food; the choices are now "So Monica…" aims.
    // why: thank ← lasagnas over the years heard as a reason to call and say thanks; easy to talk to ← her worried "What am I gonna say?"
    //   just after, so the mom-praise sounds like reassurance
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'owe', seg: [30.0, 36.7],
      stem: 'Why does Joey bring up what his mom has sent over the years?',
      choices: ['So Monica feels she owes his mom a call', 'So Monica remembers to thank her for the food',
                'So Monica sees his mom is easy to talk to'], a: 0,
      cue: '「Let’s not forget」で始まる文の働き。',
      line: '*Let’s not forget*, this is a woman who has sent you *many lasagnas*',
      said: '「忘れないで、母は何年もラザニアを送ってくれた人だよ」と言う。',
      mean: 'Let’s not forget ＝ 恩を思い出させる言い方。電話くらいして、という説得。',
      trap: '料理の話に聞こえるが、ラザニアは「借り」の例。',
      use: 'Let’s not forget who drove you here.（ここまで送ったのは誰か忘れないでね）' },

    // R fix: V2 — "planning to send some soon" was weak. The new distractor takes the rhetorical "Is it her fault" as
    //   a real admission.
    // R fix: V2 (blind 65 %) — Joey admitting fault was out of character, so the key stood alone. Now "came very late"
    //   (make it = 間に合う), the near miss from the dropped c1.
    // why: came late ← "make it" known from “make it to the wedding” (間に合う), so "didn't make it" heard as late;
    //   forgot ← "her fault" flipped to Monica's fault, as if she got them and forgot
    { id: 'i1', skill: 'infer', level: 'C1', point: 'lasagna', reveals: ['makeit', 'fault'], seg: [32.9, 41.0],
      stem: 'When Monica says no lasagnas ever came, what does Joey claim?',
      choices: ['His mom sent them, but some never got there', 'His mom sent them, but they came very late',
                'Monica got them all, but has forgotten'], a: 0,
      cue: '「Is it her fault」のあと、「to you」まで。',
      line: 'Is it her fault if some of them *didn’t make it to you*?',
      said: '「届かなかった分があっても母のせいじゃない」と言い返す。',
      mean: '送ったと言い張り、届かないのは途中の問題にする。苦しい言い訳。',
      trap: 'make it を「間に合う」と取ると「遅れた」になる。ここは「届かなかった」。',
      use: 'Did my package make it to you?（荷物、ちゃんと届いた？）' },

    // R drop: c1 (C2 humor, lasagna ↔ post office) — still 70 % blind after two rewrites ("went missing" matches the
    //   post-office plan on sight); never shipped, deleted. c4 replaces it as a C2 item.
    // anchor: 38.8–39.7 s both sources “if some of them didn't make it”, the six words after “if” in under a second
    { id: 'c3', skill: 'dict', level: 'C2', point: 'fault', reveals: ['lasagna', 'makeit'], seg: [37.6, 41.2],
      stem: 'Type the words: “Is it her fault if ___ to you?” (6 words)', answer: "some of them didn't make it",
      cue: '「fault if」のすぐあと、弱い語が続く。',
      line: 'Is it her fault if *some of them didn’t make it* to you?',
      said: '「何個か届かなかったとして、母のせい？」。6語がひと息。',
      mean: 'of と them は弱く、some of them ≈「サマヴェム」。didn’t の t も消える。',
      trap: 'some them、did と書きやすい。弱い語も落とさず、文の形に戻す。',
      use: 'Some of them didn’t show up.（何人かは来なかった）' },

    // R new: replaces n2 as the fourth literal item. Blind read: 40 % (two "mix-up" choices, two "invitations" choices).
    // why: seating ← the table plan opens the scene, and "mix-up" is caught without what follows; Chandler forgot ←
    //   "invitations" caught, and a groom who forgot to mail them is a familiar sitcom script
    { id: 'd3', skill: 'detail', level: 'B1', point: 'mixup', seg: [41.3, 46.45],
      stem: 'When Monica asks what to say, what does Joey suggest first?',
      choices: ['There was a mix-up with the invitations', 'There was a mix-up with the seating',
                'Chandler forgot to mail the invitations'], a: 0,
      cue: '「I don’t know」のあと、「tell them」以下。',
      line: 'Just tell them there was *a mix-up with the invitations*.',
      said: '「さあね、招待状で手違いがあったって言えば」と、まず一つ案を出す。',
      mean: 'mix-up ＝ 手違い、取り違え。だれのせいとも言わない、ぼかした言い訳。',
      trap: 'mix-up だけ聞いて後ろを落とすと、冒頭の席の話と結びつけやすい。with のあとまで聞く。',
      use: 'Sorry, there was a mix-up with our booking.（予約に手違いがあったみたいで）' },

    // R fix: V2 — "the post office" was the stock excuse for lost invitations, and it stood out against "Chandler" and
    //   "the catering firm" (a cold re-read put it at 70 %). Now a second invitation-trade culprit, the print shop,
    //   plus Joey's own first idea, which "no, no, no" throws out. It now reveals d3's key.
    // why: print shop ← a stock culprit for invitations that never arrived, and "post…" / "print…" open alike;
    //   invitation mix-up ← Joey's first idea, said just before "no, no, no"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'postoffice', reveals: ['mixup'], seg: [42.5, 51.2],
      stem: 'What does Joey finally suggest that Monica blame?',
      choices: ['The post office', 'The print shop', 'A mix-up with the invitations'], a: 0,
      cue: '「mix-up」の案のあと、「no, no, no」で言い直す部分。',
      line: 'Or no, no, no. *Blame it on the post office*.',
      said: '「招待状の手違い」と言いかけ、すぐ「郵便局のせいにしろ」と言い直す。',
      mean: 'blame it on ～ ＝ ～のせいにする。だれも責められない相手を選んでいる。',
      trap: '最初の「手違い」案に引かれやすい。no, no, no のあとが最終案。',
      use: 'Just blame it on the traffic.（渋滞のせいにしちゃえ）' },

    // R fix: V2 — "used to work at the post office" was a weak reason, and only the key and it named the post
    //   office. The stem now names it, and the choices are three reasons a story could be believed.
    // R fix: V2 (blind 55 %) — "already" and the stem's "post-office" left the key the only post-office reason. Now
    //   "their own mail goes missing" is a second one, and "already" is gone.
    // why: trust Monica ← the bride calling in person sounds convincing on its own; mail goes missing ← lost
    //   invitations heard as their own trouble with the mail, a reason Joey never gives
    { id: 'i2', skill: 'infer', level: 'B2', point: 'hate', reveals: ['postoffice'], seg: [45.5, 51.2],
      stem: 'Why does Joey think the post-office story will work on his parents?',
      choices: ['They can’t stand the post office', 'Their own mail often goes missing',
                'They trust whatever Monica says'], a: 0,
      cue: '言い直したあと、「They」で始まる短い文。',
      line: '*They hate the post office*.',
      said: '「うちの親は郵便局が大嫌いだから」と、その言い訳を選んだ理由を言う。',
      mean: 'もともと嫌っている相手のせいにすれば、疑わずに信じてくれる、という読み。',
      trap: '花嫁の電話なら信じる、と常識で補いやすい。理由は They のあとの hate。',
      use: 'She’ll believe it; she hates that place.（信じるよ、あの店大嫌いだから）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'makeit', seg: [62.3, 66.9],
      stem: 'Type the words: “…really hope that you can ___ the wedding.” (3 words)', answer: 'make it to',
      cue: '「you can」のすぐあと、つながった3語。',
      line: 'Chandler and I… really hope that you can *make it to* the wedding.',
      said: '「Chandler と私は、結婚式に来てほしいと本当に願っています」と伝える。',
      mean: 'make it to ～ ＝ ～に来られる。3語がつながり「メイキットゥ」。',
      trap: 'come to と書きたくなるが、聞こえた音どおりに。',
      use: 'Can you make it to dinner Friday?（金曜の夕食、来られる？）' },

    // R fix: S2/§9.2 — the stem quoted "apparently", the word under test. It now names the moment only.
    // why: obvious ← the adjective apparent = 明らか; apologizing ← a call about a mistake is expected to carry an
    //   apology (Japanese frame)
    { id: 'm1', skill: 'marker', level: 'B2', point: 'apparently', reveals: ['werent', 'bunch'], seg: [66.6, 70.6],
      stem: 'Right before the invitation news, what does Monica’s one-word lead-in do?',
      choices: ['Passes it on as something she was told', 'Stresses that it is plain and obvious',
                'Shows she is apologizing for it'], a: 0,
      cue: '文頭の「Yeah」のすぐあとの一語。',
      line: 'Yeah, *apparently* a bunch of the invitations…',
      said: '「どうやら招待状の一部が届かなかったみたいで」と説明する。',
      mean: 'apparently ＝ どうやら〜らしい。聞いた話として伝え、責任から少し離す。',
      trap: '形容詞 apparent は「明らかな」。副詞は「らしい」。謝る言葉はない。',
      use: 'Apparently, the flight is delayed.（どうやら飛行機が遅れてるらしい）' },

    // R fix: V2 — with "invitations" in the stem, the call's purpose made the negative obvious, and "won't be" clashed
    //   with "sent". Now two negatives, and the stem drops "invitations".
    // why: were ← n't's t drops, leaving "were" plus a faint n; were never ← the n after "were" heard as the start of
    //   "never", the same w…n outline
    { id: 's1', skill: 'sound', level: 'B2', point: 'werent', reveals: ['bunch'], seg: [66.6, 70.6],
      stem: 'Fill the gap: “…that we sent, uh, ___ delivered.”',
      choices: ['were', 'weren’t', 'were never'], a: 1,
      cue: '「sent」のあと、「delivered」の前の短い語。',
      line: 'a bunch of the invitations that we sent, uh, *weren’t* delivered.',
      said: '「送った招待状の一部が届かなかった」と言っている。',
      mean: 'weren’t の t はほぼ消え、「ワーン」のように短く聞こえる。n の音が否定のしるし。',
      trap: 'were なら逆の意味、were never なら音が一つ多い。n は残る。',
      use: 'My bags weren’t on the flight.（荷物が便に載っていなかった）' },

    // R new: C2, replaces c1/c2. Both sources agree on the words; the caption timings put the four words in 0.45 s.
    // anchor: 67.7–68.2 s both sources “apparently a bunch of the invitations”: “a”, “of” and “the” all weak, run on
    { id: 'c4', skill: 'dict', level: 'C2', point: 'bunch', reveals: ['apparently'], seg: [66.6, 70.6],
      stem: 'Type the words: “Yeah, apparently ___ invitations…” (4 words)', answer: 'a bunch of the',
      cue: '「apparently」のすぐあと、短い語が続く。',
      line: 'Yeah, apparently *a bunch of the* invitations…',
      said: '「どうやら招待状の多くが…」と切り出す。',
      mean: 'a bunch of ＝ たくさんの。a、of、the は弱く「アバンチャヴザ」と一続き。',
      trap: 'bunch だけ書いて a や the を落としやすい。小さな語も文の形から補う。',
      use: 'A bunch of us are going out tonight.（今夜、何人かで出かけるよ）' },

    // R fix: V2/K5 — "to sound like Joey's mom" was an odd aim, and "Real" was the only unhedged choice. Now two
    //   put-on aims and one real reason, parallel.
    // why: real ← "damn" and "screw-up" heard at face value (the excuse taken as fact); feel guilty ← right idea
    //   (put on), wrong aim
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'fake', reveals: ['postoffice', 'hate'], seg: [70.4, 78.8],
      stem: 'In the call, how real is Monica’s anger at the post office?',
      choices: ['Put on, to take his mom’s side', 'Real, since the mail let her down',
                'Put on, to make his mom feel guilty'], a: 0,
      cue: '前半で Joey が勧めた言い訳と、電話での言い方。',
      line: 'I guess there was some screw-up at the *damn* post office.',
      said: '「郵便局で何かへまがあったみたい。あのいまいましい郵便局」と言う。',
      mean: '両親が郵便局嫌いだと聞き、同じ側に立って話を合わせている。',
      trap: 'damn の強さで本気に聞こえるが、言い訳は自分たちの作り話。前の場面と結んで聞く。',
      use: 'Ugh, don’t get me started on traffic.（渋滞の話はもう、やめて）' },

    // R drop: c2 (C2 humor, "agrees with a complaint about her own lie") — 60 % blind after its one rewrite (the only
    //   choice that names the lie); never shipped, deleted.
    // R fix: V2 (blind 75 %) — after a complaint, "I know exactly what you mean" was the only fitting reply. Now a
    //   caller's apology (ご迷惑を…, Japanese frame) and the literal "tell me", both things a caller might say.
    // why: explain ← literal reading (それについて教えて); sorry ← the caller apologizing for the trouble, the polite
    //   frame for a call about a mistake
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'tellme', reveals: ['postoffice'], seg: [70.4, 78.8],
      stem: 'After “the damn post office”, what does Monica’s short reply mean?',
      choices: ['I know exactly what you mean', 'I’m sorry it caused you trouble', 'Tell me what they did to you'], a: 0,
      cue: '相手の文句に対する、4語の返事。',
      line: '*Tell me about it*.',
      said: '相手の郵便局への文句に、「ほんとそれ」と返している。',
      mean: 'Tell me about it ＝ まったくだよ。説明を求めず、強い同意を示す。',
      trap: '文字通り「それについて話して」と取りやすい。愚痴のあとなら同意の決まり文句。',
      use: 'Tell me about it. It’s freezing today.（ほんとそれ。今日寒すぎ）' },

    // R fix: V2 — "lost" ↔ "goes missing" matched on sight, and "mail is slow" was the only other Post→Lost choice.
    //   A cold re-read still put the key at 70 %, so in a second rewrite all three are Post→Lost, each with a sense of
    //   "lost".
    // R fix: V2 (blind 80 % after two rewrites) — "Post becomes Lost" in every choice showed the word, so "lose mail"
    //   followed on sight. The choices no longer show it; the learner has to hear "Lost".
    // why: slow ← the stock complaint about the mail, with the swapped word missed; costing ← "Lost" heard as "cost",
    //   a near sound
    { id: 'h1', skill: 'humor', level: 'C1', point: 'lostoffice', reveals: ['postoffice'], seg: [78.6, 84.4],
      stem: 'What is the joke in Monica’s line about the US Post Office?',
      choices: ['It renames the post office for losing mail', 'It renames the post office for being slow',
                'It renames the post office for costing a lot'], a: 0,
      cue: '「more like」のあと、一文字だけ変わる語。',
      line: 'the US Post Office? No, more like US *Lost Office*.',
      said: 'Post Office を Lost Office と言い直して笑う。',
      mean: 'Post を音の似た Lost に変えたダジャレ。手紙をなくす郵便局、という皮肉。',
      trap: 'L を聞き落とすと cost（高い）に、語を聞き流すと「遅い」に流れる。',
      use: 'More like a nightmare than a vacation.（休暇というより悪夢）' },
  ]
};
