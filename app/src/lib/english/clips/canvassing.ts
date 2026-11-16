// REVIEW 2026-11-16: pass 5, fix 14, drop 2, new 1; ear checks 1
// “Parks and Recreation | Canvassing (Episode Highlight)” (the official Parks and Recreation channel, Season 1 | Parks
// and Recreation): Leslie takes her team door to door to drum up support for turning the Sullivan Street pit into a
// park; the people she meets like the idea and won't back it, Tom quits, and the last resident doubts the whole plan.
// Segments from the captions, words from whisper (2026-11-16). The sources differ at 4.2 s (“fun” / “funny”), 31 s
// (captions drop “tell you”), 48 s (“love for you” / “love them”), 50.3 s (“I'm all for a park” / “I'm off work”),
// 81 s (“No flyer?” / “liar”), 94.5 s (“Team Haverford” / “Tina”) and 100.6 s (“head out. Peace.” / “have a piece”);
// no key rests on those words. No item uses 57–84 s (the second resident: the “no kids”, playground and
// “1,000 feet from my house” lines hint at a sex offender), or the “This is so great” lines at 88–94 s (whose they
// are and whether they're sarcastic can't be settled without the picture).
// EAR CHECK: 19.5 s i1 c2 — whisper “Excellent. Positive response.” / captions “I just want positive response”; both
//   keys need only “positive response”, taken as Leslie's (the same voice goes straight on with the pitch)
import type { Clip } from '../types.ts';

export const canvassing: Clip = {
  id: 'canvassing', video: 'fpjgXEga8AA', title: 'Parks and Recreation | Canvassing (Episode Highlight)', dur: 133,
  wpm: 157, band: 'mid', tags: ['お願い・断り', '職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R drop: g2 (V2 blind 75 % + V4/S4): a pep talk of the first 11 s isn't the scene's purpose, and the 10.7 s
    //   segment is too short for a gist; d1 keeps the advice
    // why: friendly but serious ← two opposite qualities, the same shape as the key; relaxed ← "confident" heard,
    //   "humble" lost
    { id: 'd1', skill: 'detail', level: 'B1', point: 'humble', seg: [6.2, 10.6],
      stem: 'How does Leslie tell the team to look?',
      choices: ['Friendly but serious', 'Humble but confident', 'Confident but relaxed'], a: 1,
      cue: '「look」のあと、but でつながる二語。',
      line: 'Look *humble*. But *confident*.',
      said: '「謙虚に見せて。でも自信を持って」と助言する。',
      mean: 'humble ＝ 控えめ、謙虚。控えめさと自信の両方を見せろ、という指示。',
      trap: 'humble は「ハンブル」と短く、聞きのがしやすい。but の前と後を一語ずつ拾う。',
      use: 'Be polite, but don’t be shy.（礼儀正しく、でも遠慮しないで）' },

    // R fix: V2 (blind 55 %), "neighbors" was a filler; "running for local office" (the keyword "local" plus the
    //   canvassing-as-campaign frame) replaces it
    // why: park group ← the topic is a park, so a park club sounds likely; local office ← "local" heard, and door to
    //   door read as an election campaign
    { id: 'd2', skill: 'detail', level: 'B1', point: 'intro', seg: [11.1, 18.0],
      stem: 'How does Leslie introduce the group at the door?',
      choices: ['As volunteers from a park group', 'As people from the local government',
                'As a team running for local office'], a: 1,
      cue: '「Good afternoon」のすぐあと。',
      line: 'We are *representatives from your local government*.',
      said: '「こんにちは。私たちは地元の役所の者です」と名乗る。',
      mean: 'representatives ＝ 代表者。市の職員として話しに来た、ということ。',
      trap: '公園の話なので市民団体と思いやすい。local government を聞く。',
      use: 'Hi, I’m calling from the hotel.（もしもし、ホテルの者ですが）' },

    // R fix: V2 (blind 55 %), the election choice didn't name the park and stood out; "money toward building" (support
    //   read as 支援金) replaces it. "park" leaves reveals with d3's drop
    // why: money ← "support" read as funding; sign a form ← the usual door-to-door petition script
    { id: 'g1', skill: 'gist', level: 'B1', point: 'goal', reveals: ['when', 'voice'], seg: [11.1, 51.0],
      stem: 'What are Leslie and her team going door to door to ask for?',
      choices: ['Support at a meeting about a new park', 'Money toward building a new park',
                'Names on a form for a new park'], a: 0,
      cue: '計画の説明のあとの、お願いの文。',
      said: '穴を公園にする計画を説明し、明日の夜の集まりに来て支持を示してほしいと頼む。',
      mean: '訪問の目的は、集まりに人を呼ぶこと。賛成と言ってもらうだけでは足りない。',
      trap: 'support を「お金」と取りやすいが、頼みは集まりへの参加。come のあとを聞く。',
      use: 'Can we count on your support?（応援をお願いできますか）' },

    // R fix: V2/K6 (blind 50 %), the key was the only hedged choice ("Only…"); the hedge is gone
    // why: back the park ← the scene is about the park, so "sure" sounds like agreement to it; come ← the meeting
    //   is the team's aim, heard as already won
    { id: 'i1', skill: 'infer', level: 'C1', point: 'sure', seg: [14.9, 21.2],
      stem: 'When Leslie notes a “positive response”, what has the resident agreed to?',
      choices: ['To talk with them for a moment', 'To support the plan for the park',
                'To come along to the meeting'], a: 0,
      cue: '「Sure」の直前の質問。',
      line: 'May we *speak with you for a moment*…? — *Sure.* — …Positive response.',
      said: '「少しお話しできますか」に「どうぞ」と返され、「良い反応」と言う。',
      mean: 'Sure は「話を聞くよ」というだけ。まだ計画の中身は何も聞いていない。',
      trap: '公園の場面なので、Sure を計画への賛成と取りやすい。返事は直前の質問に答えている。',
      use: 'Sure, what’s up?（いいよ、どうしたの？）' },

    // R fix: V2 (blind 60 %) + S3 (the cue's "Sure" was a key-only word); the key no longer says "bare", and every
    //   choice now turns on the same "sure"
    // why: the resident ← a one-word answer heard as the joke; the team ← "Are you ready?" from the start heard as
    //   them being the nervous ones
    // anchor: 15.4–20.1 s "May we speak with you for a moment" → "Sure" → "positive response": the only thing agreed
    //   to is a moment's talk, and Leslie is the one who counts it
    { id: 'c2', skill: 'humor', level: 'C2', point: 'sure', seg: [14.9, 26.2],
      stem: 'In the moment around “positive response”, who is the joke on?',
      choices: ['Leslie, for treating a “sure” to a chat as a win', 'The resident, for a “sure” before hearing the plan',
                'The team, for needing every “sure” counted as a win'], a: 0,
      cue: '一語の返事が何への答えかと、その呼び方。',
      line: 'May we speak with you for a moment…? — *Sure.* — …*Positive response.*',
      said: '「少しお話しできますか」「どうぞ」のあと、すぐ「良い反応」とつぶやく。',
      mean: '話してもいいと言われただけで成果に数えている。熱心すぎる本人が笑われている。住民は普通に答えただけ。',
      trap: '一言の返事が笑いに聞こえやすい。笑いの的は、誰の言葉が大げさかで決まる。',
      use: 'He said hi. That’s basically a yes.（あいさつしてくれた。ほぼイエスだね）' },

    // R drop: d3 (V1 + V2, blind 85 %): the show's name and the other items' choices all say "park"; a B1 word check
    //   with nothing left to listen for
    // R fix: V2/K6 (blind 50 %) + §9.5 + S4: the key shared a part with all three ("That ___ be" isn't grammatical);
    //   now the 2 × 2 grid of That/It and 'd/'ll. The segment was 2.55 s
    // why: That'll ← a future "will", the 'd swallowed by "be"; It'd ← the weak th- start lost; It'll ← both misses
    { id: 's1', skill: 'sound', level: 'B2', point: 'thatd', seg: [25.0, 28.35],
      stem: 'Fill the gap: “Oh, yeah. ___ be a great idea.”',
      choices: ['That’d', 'That’ll', 'It’d', 'It’ll'], a: 0,
      cue: '「Oh, yeah」のあとの最初の語、最後の音。',
      line: 'Oh, yeah. *That’d* be a great idea.',
      said: '「ああ、それはいい考えだね」と答える。',
      mean: 'That’d ＝ That would。仮の話への返事なので would が入る。',
      trap: 'd は次の be に吸われて弱い。That’ll なら l の音が残る。文頭が th か i かも聞く。',
      use: 'That’d be great, thanks.（それは助かる、ありがとう）' },

    // R fix: V4/S4, the evidence runs 27–46 s, too long for infer; it's the first door's outcome, so gist (25 s).
    //   V2 (blind 50 %): "another day" (busy heard as only tomorrow) replaces the reverse pattern "doubts but comes"
    // why: another day ← "Tomorrow. I can't" heard as only that day; comes if free ← "busy" heard as only this time
    { id: 'i2', skill: 'gist', level: 'B2', point: 'support', seg: [26.0, 51.0],
      stem: 'What does the first resident’s whole answer add up to?',
      choices: ['Likes the idea, but won’t come to back it', 'Likes the idea, but can only come another day',
                'Likes the idea, and will come if not busy'], a: 0,
      cue: '最初の返事と、最後の返事の差。',
      said: '最初は「いい考えだね」と言うが、集まりには「無理、忙しい、ごめん」と断る。',
      mean: '賛成はするが、時間は使わない。口だけの支持で、Leslie の目的には届かない。',
      trap: '最初の great idea で来てくれそうに聞こえる。賛成と行動は別に聞く。',
      use: 'Great idea. Count me out, though.（いい考え。でも私は抜けるね）' },

    // R fix: K8, a time scale with no keep: true (already in time order)
    // why: tonight ← "night" is heard, "tomorrow" lost; afternoon ← "Good afternoon" opened the visit
    { id: 'n1', skill: 'number', level: 'B1', point: 'when', seg: [34.4, 39.5],
      stem: 'When is the public forum?',
      choices: ['Tonight', 'Tomorrow afternoon', 'Tomorrow night'], a: 2, keep: true,
      cue: '「public forum」のすぐあと。',
      line: 'we are having a public forum *tomorrow night*',
      said: '「明日の夜、公開の話し合いを開きます」と言う。',
      mean: 'forum ＝ 住民が意見を言う集まり。日時は明日の夜。',
      trap: '最初の Good afternoon が耳に残りやすい。forum の直後の二語を聞く。',
      use: 'We’re having a meeting tomorrow night.（明日の夜、集まりがあります）' },

    // R fix: V2 (blind 60 %), "give money" now sits in g1; "just be there" (support read as presence, voice lost)
    //   replaces it. The cue's "support" no longer overlaps a key-only word
    // why: vote ← a "forum" heard as a place to vote; be there ← "come" heard, "voice" lost, support = 出席
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'voice', seg: [36.8, 43.0],
      stem: 'What does Leslie hope the resident will do at the forum?',
      choices: ['Speak up in favor of the park', 'Vote on the plan for the park', 'Just be there to back the park'],
      a: 0,
      cue: '「come」のすぐあとの動詞。',
      line: 'it would be great if you could come *voice your strong support*',
      said: '「来て、強い支持を声に出してもらえたら」と頼む。',
      mean: 'voice ＝ 声に出して言う（動詞）。集まりで賛成の意見を言ってほしい、ということ。',
      trap: 'come だけ拾うと「来るだけ」と取りやすい。voice が動詞で、言うことが求められている。',
      use: 'I’d like to voice a concern.（ひとつ心配な点を言わせてください）' },

    // why: another date ← the Japanese frame: after a refusal, offer something easier; really busy ← "people are
    //   busy" heard as doubting him
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'busy', seg: [42.3, 49.0],
      stem: 'When the resident says no, what does Leslie do?',
      choices: ['Accepts the reason, then asks again anyway', 'Accepts the reason, then offers another date',
                'Doubts the reason, then asks for the truth'], a: 0,
      cue: '「we understand」のあとの but。',
      line: 'I can’t. I’m busy. — *We understand* that people are busy, *but* we would love for you to come…',
      said: '「無理、忙しい」に「忙しいのは分かります。でもぜひ来てほしい」と返す。',
      mean: '理由を受け止めてから、同じお願いをくり返している。引かない押し方。',
      trap: '日本語なら別の日を出す場面。we understand は前置きで、本題は but のあと。',
      use: 'I understand, but it would mean a lot.（分かります、でもぜひ）' },

    // R fix: V2 (blind 65 %), "may come after all" was a filler; "rushed and annoyed" (closing heard, the warmth
    //   lost) replaces it
    // why: sarcastic ← "good luck" heard as "you'll need it"; annoyed ← the short turns heard as curt
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'luck', seg: [45.9, 51.0],
      stem: 'How does the resident sound when saying goodbye?',
      choices: ['Friendly, but closing the talk', 'Sarcastic, as the plan will fail', 'Rushed, and annoyed at being kept'],
      a: 0,
      cue: '「Sorry」のあとの短い一言。',
      line: 'Sorry. *Good luck, though.*',
      said: '「ごめんね。でもがんばって」と言う。',
      mean: 'though ＝ 行けないけど。応援はするが、話はここまで、という合図。',
      trap: 'good luck を皮肉と取りやすいが、Sorry と though が気持ちを和らげている。',
      use: 'I can’t make it. Good luck, though!（行けないけど、がんばって！）' },

    // dict: "would it" ≈ ウディッ; "change your" links (チェンジュア)
    { id: 'x1', skill: 'dict', level: 'B2', point: 'mind', seg: [50.6, 53.75],
      stem: 'Type it: “___ if we told you that…” (5 words)', answer: 'would it change your mind',
      cue: '断られたあと、Leslie の最後の一押しの最初。',
      line: '*Would it change your mind* if we told you that—',
      said: '「もし…と言ったら、気が変わりますか」と言いかける。',
      mean: 'change your mind ＝ 考えを変える。仮の話で押している。',
      trap: 'would it の t が弱く「ウディッ」、change your は「チェンジュア」とつながる。',
      use: 'Would it help if I came early?（早めに行ったら助かる？）' },

    // R fix: V2 (blind 60 %): three "She is still pitching after…" choices; "her team has given up" (the deadpan
    //   report heard as the team quitting) replaces "forgets her point". B1/N7: its line holds x1's answer
    // why: agreed ← "would it change your mind" and "Good luck" heard as a yes; team gave up ← the flat "She's gone"
    //   heard as a teammate's sigh about the whole effort
    { id: 'h2', skill: 'humor', level: 'C1', point: 'gone', reveals: ['mind'], seg: [50.6, 53.75],
      stem: 'Why does Leslie’s last try at the first door get a laugh?',
      choices: ['She is still pitching after the resident has left', 'She is still pitching after the resident agreed',
                'She is still pitching after her team has given up'], a: 0,
      cue: '文が that で切れたあとの短い一言。',
      line: 'Would it change your mind if we told you that— — *She’s gone.*',
      said: '「もし…と言ったら」と言いかけたところで、「もういない」と言われる。',
      mean: '最後の一押しを、相手はもう聞いていない。ドアの向こうに消えている。',
      trap: 'change your mind から、気が変わったと取りやすい。she と gone を聞く。',
      use: 'And… he’s gone.（で…もういないし）' },

    // why: another job ← the usual excuse for leaving early; not feeling well ← the other usual excuse
    { id: 'd4', skill: 'detail', level: 'B2', point: 'solo', seg: [93.2, 102.2],
      stem: 'What reason does one team member give for leaving?',
      choices: ['He works better on his own', 'He has another job to get to', 'He isn’t feeling very well'], a: 0,
      cue: '「awesome, but」のあと。',
      line: 'You guys are awesome, but I think I might *work better as a solo artist*',
      said: '「みんな最高だけど、僕はソロの方が力を出せると思う」と言う。',
      mean: 'solo artist ＝ ソロの歌手。音楽の言い方で「一人の方がいい」。',
      trap: 'artist から職業の話に聞こえやすい。work better as… は「…の方がうまくやれる」。',
      use: 'I work better alone.（一人の方がはかどるんだ）' },

    // R fix: V2 (blind 60 %), the key was the only odd, specific choice; "joke about his solo artist line" (a word
    //   said, in the wrong relation) replaces "wish him luck"
    // why: grumble ← the Japanese frame: a teammate quitting is met with complaints; solo artist ← his own odd words
    //   heard as what they pick up on
    { id: 'i3', skill: 'infer', level: 'C1', point: 'runs', seg: [100.3, 110.4],
      stem: 'How do the others react once he leaves?',
      choices: ['They only remark on the way he runs', 'They grumble that he always quits early',
                'They only joke about his “solo artist” line'], a: 0,
      cue: '彼が去ったあとの、短い二つの文。',
      line: '*He runs weird.* — *He really does.*',
      said: '彼が去ったあと、「走り方が変」「ほんとにね」とだけ言う。',
      mean: '抜けたことには何も言わない。去り方の方が気になるほど、期待していなかった。',
      trap: '日本語なら文句を言う場面。言葉にあるのは走り方だけ、という点がおかしみ。',
      use: 'He talks weird. He really does.（あの人、しゃべり方が変。ほんとに）' },

    // why: keen but worried ← "good idea" heard as the main message; annoyed ← "I'm just not sure" heard as brushing
    //   her off
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'notsure', seg: [109.9, 114.4],
      stem: 'How does the last resident sound about the plan?',
      choices: ['Doubtful, though trying to be polite', 'Keen, though worried about details',
                'Annoyed, and trying to end the talk'], a: 0,
      cue: '「good idea」のあとの but。',
      line: 'It’s a good idea, *but I’m just not sure*.',
      said: '「いい考えだけど、ちょっと分からない」と言う。',
      mean: 'good idea は前置き。本音は but のあとの not sure で、乗り気ではない。',
      trap: 'good idea を本気の賛成と取りやすい。but のあとに本音が来る。',
      use: 'It sounds nice, but I’m just not sure.（よさそうだけど、どうかな）' },

    // R fix: V2 (blind 70 %), "annoyed" was a filler; "check whether not sure is a polite no" (the Japanese frame)
    //   replaces it
    // why: polite no ← the Japanese frame: "not sure" is a soft refusal, so she checks; ending ← the same frame, so
    //   she should step back
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'whichpart', seg: [109.9, 118.55],
      stem: 'What is Leslie trying to do with her follow-up question?',
      choices: ['Find the doubt so she can answer it', 'Check whether “not sure” means a polite no',
                'Close the visit in a polite way'], a: 0,
      cue: '「Okay」のあとの which で始まる質問。',
      line: 'Okay. *Which part* are you not sure about?',
      said: '「なるほど。どの部分が分からないんですか」と聞く。',
      mean: '迷っている点を特定して、そこに答えようとしている。説得の基本の一手。',
      trap: '日本語では not sure は断りなので、引き下がると思いやすい。質問で話を続けている。',
      use: 'Which part are you worried about?（どこが心配なの？）' },

    // R fix: V2 (blind 55 %), the key was the one sweeping choice against two mild ones; all three are now
    //   "…not sure…" lines of the same shape
    // why: small part ← "which part" and "kind of" taken at face value: one part only; explained ← Leslie's job is
    //   persuading, so the line heard as her own doubt about her pitch
    // anchor: 114.5–121.6 s "Which part are you not sure about?" → "Turning the pit into a park" (the plan as she
    //   put it at 22.4–25.9 s) → "That's kind of the whole thing": "kind of" softens a "the whole thing" that is
    //   literally true
    { id: 'c1', skill: 'infer', level: 'C2', point: 'whole', seg: [109.9, 122.4],
      stem: 'Which plain-English version keeps what Leslie means by her last line?',
      choices: ['“So you’re not sure about any of it.”', '“So you’re not sure about a small part.”',
                '“So I’m not sure I explained it well.”'], a: 0,
      cue: '「kind of」のあとの言葉の大きさ。',
      line: 'Turning the pit into a park. — That’s *kind of the whole thing*.',
      said: '「穴を公園に」と言われ、「それって、ほぼ全部ですよね」と返す。',
      mean: 'kind of は控えめに見せる飾り。the whole thing は文字どおり全部で、「全部反対ってことね」となる。',
      trap: 'kind of を「少し」と取ると一部の話に聞こえる。控えめな語より、あとの語の大きさで決める。',
      use: 'That’s kind of the whole point.（それがまさに肝心なところなんだけど）' },

    // R new: x2 (C2 form ≥ 4: the bank had only s1, f1 and x1). Both sources have "I'm just not sure"; the t of
    //   "just" drops before "not". Same point as a2, whose line holds it
    { id: 'x2', skill: 'dict', level: 'B1', point: 'notsure', seg: [110.3, 114.2],
      stem: 'Type it: “It’s a good idea, but ___.” (4 words)', answer: "i'm just not sure",
      cue: '「but」のすぐあと、文の終わりまで。',
      line: 'It’s a good idea, but *I’m just not sure*.',
      said: '「いい考えだけど、ちょっと分からない」と言う。',
      mean: 'just は「ただ、どうも」と和らげる語。はっきり断らずに、乗り気でないことを伝えている。',
      trap: 'just の t は次の not の前で消え、「ジャスノッ」のようにつながる。not の t も弱い。',
      use: 'I’m just not sure it’s worth it.（それだけの価値があるか、どうも分からない）' },

    // R fix: V2 (blind 75 %), "comes out backward" was absurd; "answers a different question" (the reply heard as
    //   off-topic) replaces it
    // why: off-topic ← the reply doesn't sound like a "part", so it's heard as a non-answer; timing ← "not sure"
    //   heard as "not yet"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'whole', seg: [112.9, 122.4],
      stem: 'Why does the answer to Leslie’s question get a laugh?',
      choices: ['The one part in doubt is the entire plan', 'He answers a different question than she asked',
                'The only doubt is about when it will happen'], a: 0,
      cue: '答えの中身と、最初に聞いた計画を比べて。',
      line: 'Which part are you not sure about? — *Turning the pit into a park.*',
      said: '「どの部分が？」に「穴を公園にするところ」と答える。',
      mean: '「一部」のつもりで答えた中身が、計画そのもの。全部に反対しているのと同じ。',
      trap: '質問に合わない答えに聞こえやすい。答えを、最初に聞いた計画の文と並べてみる。',
      use: 'Which part? — Well, all of it.（どの部分？ーまあ、全部）' },
  ]
};
