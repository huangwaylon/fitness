// “Tom Hits on Ann | Parks and Recreation” (the official Parks and Recreation channel, Season 1): at a public forum
// Leslie and Tom face off-topic complaints until Ann, a nurse, asks the city to deal with a pit that broke her
// boyfriend's legs; Tom hits on her, she steers him back, Leslie pinky-promises to fill the pit and build a park, and in
// a talking head calls it her Hoover Dam.
// Segments from the captions, words from whisper (2026-11-16). Untested: 10–36 s (rambling citizens; 31–37 s is
// obscene heckling and the captions garble it), 56–68 s (Ann's “I don't care for politics” and the applause),
// 124.5–128.5 s (innuendo), 200 s on after the talking head (music). Named in the audio: Leslie Knope and Tom (3–5.5 s),
// Barry (51.5 s), Ann Perkins (57 s). Tom is the man questioning Ann (101–152 s); Leslie is the woman on the panel.
// REVIEW 2026-11-16: pass 4, fix 19, drop 1, new 0; ear checks 0 (g3/d6 no longer turn on who speaks; nt3 dropped;
//   s1's removed: both sources agree word for word)
//   open: t2 is a tone item kept on its words (“actually… right now”); worth a listen if the phone check has time.
//   open: i2, t2 and h1 stay blind-guessable at 65–80 % because the title (“Tom Hits on Ann”) names the flirting.
import type { Clip } from '../types.ts';

export const tomHitsOnAnn: Clip = {
  id: 'tomhitsonann', video: 'KHark3X5jHI', title: 'Tom Hits on Ann', dur: 250, wpm: 161, band: 'mid',
  tags: ['お願い・断り', '恋愛'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 55 %, right): “tired” was a filler; now a parks-only reading of her offer
    // why: nervous ← “take two” (a restart) suggests a shaky start; parks only ← a parks panel, so “your questions”
    //   heard as questions on parks
    { id: 't1', skill: 'attitude', level: 'B1', point: 'fire', seg: [2.4, 10.2],
      stem: 'How does Leslie sound as she opens the forum?',
      choices: ['Eager to take on any question at all', 'Nervous about what people will ask',
                'Ready, but only for questions on parks'], a: 0,
      cue: '自己紹介のあと、文の最後の二語。',
      line: 'We are here to answer *any and all* of your questions, so *fire away*.',
      said: '「どんな質問にも答えます。どんどん聞いて」と呼びかける。',
      mean: 'any and all と fire away で、どんな質問も歓迎という構え。',
      trap: '冒頭の take two（撮り直し）で緊張に聞こえやすいが、言葉はやる気を示している。',
      use: 'Any questions at all, just ask.（何でも聞いてね）' },

    // R fix: S2/§9.2 and V2 (blind 85 %, right): the stem quoted the phrase under test, so knowing the idiom answered
    //   it without listening; the stem now names the moment, and “leave” (a filler) became a keep-it-short reading
    // why: anger ← fire = 撃つ・怒り, and the forum does get loud later; short ← “fire” as rapid fire, quick and brief
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'fire', seg: [6.3, 10.2],
      stem: 'What do Leslie’s last two words invite the public to do?',
      choices: ['Ask their questions, one after another', 'Let out all their anger at the panel',
                'Keep their questions short and quick'], a: 0,
      cue: '「questions」のすぐあと、so に続く二語。',
      line: 'We are here to answer any and all of your questions, so *fire away*.',
      said: '「質問には全部答えます。さあ、どうぞ」と締めくくる。',
      mean: 'fire away ＝ 遠慮なくどんどん聞いて。質問を受ける場でよく使う。',
      trap: 'fire を「撃つ・怒り」や「速射」と取ると、怒りや早口の話に見える。質問の直後なら「どうぞ」。',
      use: 'Got questions? Fire away.（質問ある？どうぞ）' },

    // R fix: V2 (blind 60 %, right): “budget” was a filler and “odd… wander” the only colorful choice; now a
    //   keyword trap on “it's a great day”
    // why: thanks ← “Well, it's a great day” opens the first comment; step down ← “being yelled at” and “caring loudly
    //   at me” heard as the crowd turning on the panel
    { id: 'g1', skill: 'gist', level: 'B2', point: 'forum', seg: [6.3, 55.7],
      stem: 'What are the first few comments from the public like?',
      choices: ['Rambling complaints on unrelated things', 'Cheerful thanks for the parks staff',
                'Angry calls for the panel to step down'], a: 0,
      cue: '最初の数人が、何について話しているか。',
      said: '「刑務所に入れられた」「音楽がうるさい」など、公園と関係の薄い話が続く。',
      mean: '住民の声を聞く会が、脱線した不満の場になっている。',
      trap: 'yelled at（怒鳴られる）が聞こえると、批判の集中砲火に見える。中身は脱線した苦情ばかり。',
      use: 'Let’s stay on topic, please.（話を本題に戻しましょう）' },

    // R fix: V2 (blind 65 %, right): “stopped listening” was easy to rule out; now the near miss a fluent non-native
    //   picks (same reframe, plus a “but it still hurts”)
    // why: don't care ← “caring loudly” heard in reverse (shouting = not caring what I think); still hurts ← the
    //   reframe heard as brave words over a real complaint
    // anchor: 37.12–46.08 s “These people are members of a community that care about where they live. So what I hear
    //   when I'm being yelled at is people caring loudly at me.”: “So” makes the yelling a sign of that caring
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'loudly', seg: [36.6, 46.6],
      stem: 'Which plain-English version keeps what Leslie means about being yelled at?',
      choices: ['“The shouting shows they care, and I take it well.”',
                '“The shouting shows they care, but it still hurts.”',
                '“They shout because they don’t care what I think.”'], a: 0,
      cue: '「community」の文と、「So」でつながる次の文。',
      line: 'members of a community that *care about where they live*. So what I hear… is *people caring loudly at me*.',
      said: '「町を大事に思う人たちだから、怒鳴られても、大声で気にかけてくれていると受け取る」。',
      mean: 'yell at を caring loudly と言いかえ、苦情を前向きに読みかえている。',
      trap: 'つらいけど我慢、と本音を探しやすい。So の前の一文が言いかえの理由で、不満の but は出てこない。',
      use: 'Complaints mean they care.（苦情は関心のあらわれ）' },

    // R fix: V2 (blind 60 %, right): “Politely” only in the key; now a welcome-back reading from “always great to have
    //   you here”
    // why: welcome ← “Always great to have you here” taken at face value; say more ← “Thank you so much” heard as
    //   interest in his point
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'barry', seg: [47.0, 55.7],
      stem: 'When a man starts on Laura Linney, what does the reply do?',
      choices: ['Ends his turn before he gets going', 'Welcomes him back as a regular',
                'Invites him to say a bit more'], a: 0,
      cue: '彼の最初の一文のすぐあと、名前を呼ぶ返事。',
      line: '…about Laura Linney. — *Thank you so much, Barry*. Always great to have you here. *Anyone else*…?',
      said: '話し始めた男性に、すぐ「ありがとう、バリー。ほかの方は？」と返す。',
      mean: 'お礼の形で話を終わらせ、次へ回している。',
      trap: 'Thank you や always great を文字通りに取ると歓迎に見える。直後の Anyone else が本当の意味。',
      use: 'Thanks, that’s all the time we have.（ありがとうございます、時間です）' },

    // R fix: V2 (blind 80 %, right): only the key had the city and “dangerous”; the injury reading now asks the city
    //   too, and the builder reading is about the pit
    // why: city money ← her boyfriend broke both legs and the land is the city's; builder ← “a developer dug out…
    //   went bankrupt”
    { id: 'g2', skill: 'gist', level: 'B1', point: 'pit', reveals: ['legs'], seg: [68.1, 164.7],
      stem: 'What does Ann come to the forum to get?',
      choices: ['Action from the city to deal with the pit', 'Money from the city for her boyfriend’s legs',
                'Help tracking down the builder who dug it'], a: 0,
      cue: '最初の用件と、最後の「bottom line」のあと。',
      line: 'I’m here to talk about the *abandoned lot*… *you need to do something about it*.',
      said: '空き地の穴で恋人がけがをした。市に何とかしてほしいと訴える。',
      mean: '恋人のけがは例。目的は、市に穴をどうにかさせること。',
      trap: '恋人のけがの話が長いので治療費に聞こえやすい。最後の you need to do something が用件。',
      use: 'I’m here about the broken streetlight.（壊れた街灯の件で来ました）' },

    // R fix: V2 (blind 60 %, right): the city-dug reading was easy to rule out; now a builder-dug near miss that only
    //   “went bankrupt” refutes
    // why: city halted ← “government owned” later, heard as the city stopping the work; old basement ← “basement” is
    //   said, as what was dug
    { id: 'd3', skill: 'detail', level: 'B2', point: 'pitwhy', seg: [79.0, 88.8],
      stem: 'How did the pit in the lot come to be there?',
      choices: ['A builder dug it, then ran out of money', 'A builder dug it, then the city halted it',
                'An old house’s basement caved in'], a: 0,
      cue: '「developer」から「bankrupt」まで。',
      line: 'a *developer dug out a basement* for some condos and then they *went bankrupt*',
      said: '開発業者がマンション用に地下を掘ったが、倒産してそのまま。',
      mean: 'went bankrupt ＝ 倒産した。工事が止まり、穴だけ残った。',
      trap: 'basement が聞こえるので「古い家の地下が崩れた」と取りやすい。dug out（掘った）の主語を聞く。',
      use: 'The company went bankrupt last year.（その会社は去年倒産した）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'pitwhy', seg: [81.5, 84.65],
      stem: 'Type what Ann says: “a developer ___ a basement” (2 words)', answer: 'dug out',
      cue: '「developer」のすぐあと、2語。',
      line: 'a developer *dug out* a basement for some condos',
      said: '「開発業者が地下室用に掘った」と言っている。',
      mean: 'dug は dig（掘る）の過去形。dug out がつながり「ダガウ」に近い。',
      trap: 'out の t が次の a につながり、一語に聞こえやすい。過去の話なので dig ではなく dug。',
      use: 'They dug out the old tree.（古い木を掘り出した）' },

    // why: a few months ← Ann later says “fixed for months”; several years ← “six years” in the talking head
    { id: 'n2', skill: 'number', level: 'B1', point: 'year', seg: [85.8, 92.9], keep: true,
      stem: 'How long has the pit been there?',
      choices: ['A few months', 'Almost a year', 'Several years'], a: 1,
      cue: '「giant pit」のあと、been there for に続く部分。',
      line: 'it’s been there for *almost a year*. — *Twelve months*.',
      said: '「1年近くそのまま」と言い、聞いた側が「12か月」と言い直す。',
      mean: 'almost a year ＝ ほぼ1年。言い直しで、長さがはっきりする。',
      trap: 'あとで for months とも言うので短く感じやすい。期間は been there for の直後。',
      use: 'It’s been broken for almost a year.（もう1年近く壊れたまま）' },

    // R fix: V2 (blind 50 %, right) and K6: “both legs” sat where the choices' two features met; now a full 2 × 2
    //   (both/one × legs/arms), all four strong
    // why: one leg ← “both” is quick and weak; arms ← “musician” is heard just before, and arms matter to a player
    { id: 'd4', skill: 'detail', level: 'B1', point: 'legs', seg: [92.9, 101.4],
      stem: 'What happened to Ann’s boyfriend?',
      choices: ['He fell in and broke both legs', 'He fell in and broke one leg', 'He fell in and broke both arms',
                'He fell in and broke one arm'], a: 0,
      cue: '「musician」の話のあと、「anyway」に続く部分。',
      line: 'he *fell in and broke both his legs*',
      said: '音楽家の恋人の話をはさんでから、「穴に落ちて両足を折った」と言う。',
      mean: 'both his legs ＝ 両足。「死にかけた」の中身はこれ。',
      trap: 'musician が聞こえるので手のけがを想像しやすい。but anyway のあとに本題が戻る。',
      use: 'He slipped and broke his arm.（すべって腕を折ったの）' },

    // R fix: S2/V2 (blind 70 %, right): the stem quoted “serious”, the word whose sense is tested, and “sue” was weak;
    //   the stem now points at the two questions, and the surface reading (marriage plans) is the near miss
    // why: how hurt ← “serious” heard about the injury (a serious injury); marry ← “serious… living together” taken at
    //   face value, with no motive behind it
    { id: 'i2', skill: 'infer', level: 'B2', point: 'serious', seg: [106.4, 112.3],
      stem: 'What is Tom checking with his two quick questions about “this guy”?',
      choices: ['Whether Ann might be open to him', 'Whether the man is badly hurt', 'Whether the couple plan to marry'],
      a: 0,
      cue: '「serious」のすぐあとの、もう一つの質問。',
      line: 'this guy is pretty *serious*? You guys *living together*?',
      said: 'けがの話の直後、「その彼とは真剣なの？一緒に住んでる？」と聞く。',
      mean: 'serious は「真剣な交際」。同居も聞くので、関係を探っている。',
      trap: 'けがの話の直後なので「重いけが」と取りやすい。次の living together が意味を決める。',
      use: 'So, is it serious with her?（で、彼女とは本気なの？）' },

    // R fix: V2 (blind 55 %, right): “move to a new place” was weak; now “let the accident go”, the other common sense
    //   of move on
    // why: let it go ← “move on” = get over it (the accident she came about); the forum ← “move on” as “next
    //   question”, and Tom later talks about the forum's time
    { id: 'i3', skill: 'infer', level: 'C1', point: 'moveon', seg: [112.0, 124.9],
      stem: 'What is Tom hinting at as he ends his sympathy speech?',
      choices: ['That she should leave her boyfriend', 'That she should let the accident go',
                'That the forum should move on now'], a: 0,
      cue: '恋人を「弱い」と言ったあとの最後の一言。',
      line: 'I’m sure this must be really tough for you… *he’s just weak*… you probably feel like you need to *move on*.',
      said: '恋人を「弱い」と下げ、「次に進みたくなるよね」と続ける。',
      mean: 'move on ＝ 次へ進む。恋人の悪口のあとなので「別れる」の意味。',
      trap: 'move on を「事故は忘れて」や「次の議題へ」と取りやすい。直前の恋人の悪口が向きを決める。',
      use: 'I think it’s time to move on.（もう次に進むときだと思う）' },

    // R fix: V2 (blind 50 %, right): with the title known, a bare emotion list gave the key away; now three readings of
    //   what her question signals, each tied to her words
    // why: hopes ��� being hit on read as a compliment, “actually” as hopeful; teasing ← a joke-like question read as
    //   banter
    { id: 't2', skill: 'attitude', level: 'B2', point: 'hitting', seg: [128.4, 131.7],
      stem: 'What does Ann’s question, cutting Tom off, signal?',
      choices: ['She can’t believe he’s doing this here', 'She hopes he’s really interested in her',
                'She’s teasing him to lighten the mood'], a: 0,
      cue: '「actually」と「right now」の入り方。',
      line: 'Are you, are you *actually* hitting on me *right now*?',
      said: '話の途中で「ちょっと待って、今まさか口説いてる？」と聞き返す。',
      mean: 'actually と right now で「こんな場で？」という驚きと不快感が出る。',
      trap: '口説かれる＝ほめられた、と取ると照れに見える。actually は信じられない気持ち。',
      use: 'Are you actually serious right now?（今、本気で言ってる？）' },

    // R fix: V2 (blind 70 %, right): “married to someone here” was weak; now a denial-then-hurt reading, and the choices
    //   share one frame
    // why: admits ← “hitting on you” heard without “I'm not”; acts hurt ← “Oh, oh, God” heard as offense at the
    //   question
    { id: 'h1', skill: 'humor', level: 'C1', point: 'deny', seg: [131.5, 143.5],
      stem: 'Why is Tom’s answer to “Are you hitting on me?” funny?',
      choices: ['He denies it, then flirts even more', 'He denies it, then acts hurt by it',
                'He admits it, then quickly says sorry'], a: 0,
      cue: '「married」のあと、自分をどう説明するか。',
      line: 'No, I’m *not hitting on you*. I’m actually married… very comfortable around women, *attractive women*.',
      said: '「口説いてない、結婚してる。魅力的な女性に慣れてるだけ」と言い訳する。',
      mean: '否定の言い訳が、そのまま口説き文句になっている。',
      trap: 'hitting on you だけ聞くと「認めた」と取りやすい。I’m not とその後の中身をセットで。',
      use: 'I’m not complaining, I’m just saying.（文句じゃないよ、言ってるだけ）' },

    // R fix: V2 (blind 65 %, right): “Brushes off” was the only evaluative verb; the accept reading now echoes Tom's own
    //   “talk about this”, so it's a real near miss
    // why: accepts ← “I'd love to do it” taken at face value, and Tom did offer to “talk about this”; delays ← “bottom
    //   line… fixed” heard as a condition (after the pit is fixed)
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'bottom', seg: [143.6, 158.2],
      stem: 'When Tom suggests a weekend away, what does Ann’s reply do?',
      choices: ['Lets his offer drop and goes back to the pit', 'Accepts his offer, as long as they discuss the pit',
                'Delays his offer until the pit has been fixed'], a: 0,
      cue: '「Look」のあと、話を何に戻すか。',
      line: '*Look*, I’d love to do it. *The bottom line is*, I’ve been trying to get this thing fixed for months',
      said: '週末の誘いに「ねえ、ぜひ…。要するに」と言って、穴の話に戻す。',
      mean: 'Look と bottom line で本題に戻す。I’d love to は受け流し。',
      trap: 'I’d love to を承知と取りやすい。すぐ話を変えたら実質は断り。',
      use: 'Look, bottom line: we need more time.（いい？要するに時間が足りないの）' },

    // R pass (ear check removed: both sources say “I'd love to do it”)
    // why: I love to ← the weak d drops; I'd like to ← same frame, /l/ start, only the vowel differs; I'd have to ← “-ve
    //   to” sounds like “love to” without its l
    { id: 's1', skill: 'sound', level: 'B2', point: 'bottom', seg: [152.4, 158.2],
      stem: 'Fill the gap: “Look, ___ do it.”',
      choices: ['I’d love to', 'I love to', 'I’d like to', 'I’d have to'], a: 0,
      cue: '「Look」のすぐあと、短くつながる部分。',
      line: 'Look, *I’d love to* do it.',
      said: '「ねえ、ぜひそうしたいけど」と前置きする。',
      mean: 'I’d の d はほとんど聞こえず、love にくっつく。',
      trap: 'd が弱いと I love to に聞こえる。それだと「〜するのが好き」で、誘いの返事にならない。',
      use: 'I’d love to, but I’m busy tonight.（ぜひ、でも今夜は忙しくて）' },

    // why: builder asked ← the developer and the bankruptcy from earlier; permit ← the usual “the city approved it”
    //   complaint script
    { id: 'd5', skill: 'detail', level: 'B2', point: 'govt', seg: [153.1, 164.7],
      stem: 'In her final point, why does Ann say the city must act?',
      choices: ['The land belongs to the government', 'The builder asked the city for help',
                'The city gave the builder its permit'], a: 0,
      cue: '「ugly」「dangerous」のあと、三つ目の理由。',
      line: 'it’s ugly and it’s dangerous and it’s *government owned*',
      said: '「放置されて、醜いし危ないし、市の土地。何とかして」と言う。',
      mean: 'government owned ＝ 行政の持ち物。だから市に責任がある。',
      trap: '業者の倒産の話が前にあるので、業者が絡む理由を探しやすい。最後の and it’s に決め手が来る。',
      use: 'It’s city property, so call the city.（市の土地だから、市に電話して）' },

    // R fix: C10/§9.7 and V2 (blind 50 %, right): the key turned on Leslie vs Tom by voice (an ear check); the choices
    //   now name no one, and the Tom reading became a pass-it-to-the-builder reading
    // why: builder ← the developer from Ann's story, the usual “not our job” script; can't use the land ← “government
    //   owned” and “location” heard as an obstacle
    { id: 'g3', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['tomorrow'], seg: [170.2, 199.7],
      stem: 'How does the panel respond to Ann’s request in the end?',
      choices: ['A promise to fill the pit and build a park', 'An offer to pass her complaint to the builder',
                'A warning that the city can’t use the land yet'], a: 0,
      cue: '最後に念を押されたあとの、答えと中身。',
      said: 'Leslie が指切りで、穴を埋めて公園を作ると約束する。',
      mean: '住民の苦情が、Leslie の大きな計画に変わる場面。',
      trap: 'government owned で、使えない土地の話に見えやすい。答えは pinky promise のあと。',
      use: 'I promise I’ll look into it.（必ず調べてみます）' },

    // R drop nt3 (C2 dict, “we i will”): S6, the answer is a self-repair (a false start, like a stammer) and not worth
    //   typing; its one doubtful word (“we”) also needed an ear check. Never shipped, so deleted. C2 stays at 2.

    // R fix: K1 and C10: “send a crew” was defensible from “we will fill in that pit”, and the stem named Leslie (who
    //   speaks, by voice only); the stem now asks for the panel's promise, and the crew became a meeting
    // why: meeting ← “location” lost and a promise heard as the usual “we'll discuss it”; call the builder ← the
    //   developer from Ann's story
    { id: 'd6', skill: 'detail', level: 'B1', point: 'tomorrow', seg: [183.8, 194.1],
      stem: 'What does the panel promise to do tomorrow?',
      choices: ['Go to the site in person', 'Call a meeting about the site', 'Call the builder’s company'], a: 0,
      cue: '「tomorrow」の直前。',
      line: 'I will *go to that location tomorrow*, and we will fill in that pit',
      said: '「明日、私がその場所へ行き、穴を埋める」と約束する。',
      mean: 'I will go ＝ 自分で行く。主語が we に変わるのは、そのあとの作業から。',
      trap: 'location を聞き逃すと、電話や会議ですませる話に見える。tomorrow の前の動詞は go。',
      use: 'I’ll go there myself tomorrow.（明日、自分で行ってみる）' },

    // R fix: V2 (blind 50 %, right): in ascending order the key was the middle choice; now last, still ascending
    // why: months ← Ann says “months” again and again; sixteen ← -teen/-ty, “six” with a stretched ending
    { id: 'n1', skill: 'number', level: 'B1', point: 'sixyears', seg: [207.8, 212.2], keep: true,
      stem: 'How long has Leslie worked at the parks department?',
      choices: ['Six months', 'Sixteen months', 'Six years'], a: 2,
      cue: '「parks department for」の直後。',
      line: 'I’ve worked at the parks department for *six years*',
      said: '「公園課で6年働いてきた」と話す。',
      mean: 'six years ＝ 6年。このあと、誇りに思う仕事を挙げていく前置き。',
      trap: 'Ann が何度も months と言ったので、月に引っぱられやすい。sixteen なら「ティーン」が長く強い。',
      use: 'I’ve lived here for six years.（ここに6年住んでる）' },

    // R fix: V2 (blind 70 %, right): the cats were a weak target; now a near miss on Leslie (modesty, the opposite
    //   stance)
    // why: modesty ← the Japanese 謙遜 frame: a small example read as playing down a big job; the city ← “citywide
    //   drive” heard as the city failing
    // anchor: 208.32–220.24 s “I've handled a lot of things that I'm proud of. Recently, I led a citywide drive to
    //   disinfect the sandbox sand… But this pit?”: the proud example is hers (“I led”), and “But this pit?” ranks it small
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'sandbox', seg: [207.8, 220.7],
      stem: 'In Leslie’s list of things she’s proud of, who is the joke on?',
      choices: ['Leslie, whose proudest example is so small', 'Leslie, who undersells a big job out of modesty',
                'The city, for leaving the sand so dirty'], a: 0,
      cue: '「proud of」のあとの例と、「But this pit?」。',
      line: 'things that *I’m proud of*. Recently, I led a citywide drive to *disinfect the sandbox sand*… But this pit?',
      said: '「誇れる仕事は多い。最近は砂場の砂を消毒する運動を率いた。でもこの穴は…」と話す。',
      mean: '胸を張った代表例が砂場の消毒。規模の小ささで笑われているのは本人。',
      trap: '小さな例を謙遜と取りやすい。I led と proud of は胸を張る言い方で、本人は本気の自慢。',
      use: 'Big win this week? I cleaned the fridge.（今週の快挙？冷蔵庫の掃除）' },

    // R fix: S2/§9.2 and V2 (blind 85 %, right): the stem quoted the idiom under test; it now asks what kind of park,
    //   and the choices are parallel noun phrases
    // why: rebuilt ← the pit is damage to repair, scratch = 傷; little money ← “scratch” as slang for cash, and the
    //   city has none
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'scratch', seg: [219.3, 224.2],
      stem: 'What kind of park does Leslie say the pit lets her build?',
      choices: ['One started from nothing at all', 'One rebuilt from an old, damaged park', 'One made with very little money'],
      a: 0,
      cue: '「whole new park」のすぐあと。',
      line: 'the chance to build a *whole new park from scratch*',
      said: '「この穴は、まったく新しい公園を一から作るチャンス」と話す。',
      mean: 'from scratch ＝ 一から、ゼロから。何もない穴だからこそできる。',
      trap: 'scratch（ひっかき傷）と取ると「傷んだ所の修理」に見える。whole new と並べば「一から」。',
      use: 'I made this cake from scratch.（このケーキ、一から作ったの）' },

    // R fix: V2 (blind 75 %, right): only the key was big and positive; the danger reading is now a too-big-for-her
    //   reading, a near miss on the same scale
    // why: too much ← Hoover Dam = a giant job, heard as a worry; block off ← dam = せき止める, read literally
    { id: 'i6', skill: 'infer', level: 'C1', point: 'dam', reveals: ['scratch'], seg: [219.3, 228.3],
      stem: 'What does Leslie mean when she calls the pit her “Hoover Dam”?',
      choices: ['The big project she’d be remembered for', 'A huge job that may be too much for her',
                'A hole she’d need to block off fast'], a: 0,
      cue: '直前の「whole new park」との関係。',
      line: 'the chance to build a *whole new park from scratch*… This could be *my Hoover Dam*.',
      said: '「一から公園を作れる。これは私のフーバーダムになるかも」と話す。',
      mean: '有名な大工事にたとえて、一生の代表作になる仕事だと言っている。',
      trap: 'dam を「せき止める」と取ると、穴をふさぐ話に見える。my が付けば「私の代表作」。',
      use: 'This project could be my big break.（この企画が出世作になるかも）' },
  ]
};
