// “Leslie Wants Her Mom's Approval So Bad | Parks and Recreation” (the official Parks and Recreation channel, Season 1):
// Leslie fishes for her mother's interest in her first town hall meeting and is turned down; Tom works the contractors,
// April is drafted as a plant, and the meeting slips away from Leslie into opposition, a weak expert and a noise feud.
// Segments from the captions, words from whisper (2026-11-16). Untested: 0–14 s ("mucky muck"/"monkey muck", and the
// Mother Teresa/Stalin/Thatcher joke needs world knowledge), 15 s ("In or out"/"Hit her out"), 89.9–118 s (Victor
// Miles, "sod", the jingle), 120–124 s ("I (don't) have a lot of stage experience": the sources disagree), 150–160 s
// ("My mom's here", "That's illegal": the context is visual), 216–250 s (Leslie blanking), 262–286 s, 293–302 s (the
// insult), 319–321 s (the band's name).
// REVIEW 2026-11-16: pass 5, fix 19, drop 0, new 0; ear checks 1
// EAR CHECK: 38.6 s s1 — "you've heard": confirm the v is there (both sources write "you've")
import type { Clip } from '../types.ts';

export const leslieMom: Clip = {
  id: 'lesliemom', video: '_Tk0dR70XSE', title: 'Leslie Wants Her Mom\'s Approval So Bad', dur: 348, wpm: 164,
  band: 'mid', tags: ['職場', 'お願い・断り'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 80 %): the scare-quoted "remembers" flagged the trick; all three are now plain moves by Leslie
    // why: asks at once ← "what do you want, Leslie?" invites a straight answer; as gossip ← "just here to gossip" and
    //   "people are talking about it" heard as news about someone else
    { id: 'g1', skill: 'gist', level: 'B2', point: 'invite', seg: [19.1, 66.3],
      stem: 'How does Leslie get around to inviting her mother?',
      choices: ['She pretends to be leaving, then brings it up', 'She asks right away, then explains the meeting',
                'She passes it on as gossip about someone else'], a: 0,
      cue: 'bid you adieu のあと、急に思い出したふり。',
      line: 'so I shall *bid you adieu*. — Oh, that’s weird. *I just remembered something.*',
      said: '「忙しそうだし帰るね」と去るふりをして、「あ、思い出した」と切り出す。',
      mean: '直接頼まず、ついでのふりで話を出す作戦。母の反応を気にしている。',
      trap: 'what do you want? と聞かれるので、すぐ頼んだように思える。帰るふりのあとが本題。',
      use: 'Oh, before I forget…（あ、忘れないうちに…）' },

    // R fix: V2 (blind 80 %): "stop the gossip" and "join" were fillers; now a worried reading and a spread-the-word
    //   reading, both about her mother hearing
    // why: heard bad things ← "people are talking" sounds like rumors; tell people ← "talking about it" heard as Leslie
    //   wanting more talk
    { id: 'i1', skill: 'infer', level: 'C1', point: 'talking', seg: [32.3, 41.1],
      stem: 'Why does Leslie mention that people are talking about her subcommittee?',
      choices: ['She hopes her mother has heard and is impressed', 'She worries her mother has heard something bad',
                'She wants her mother to tell people about it'], a: 0,
      cue: 'I’m sure のあと、母の返事を待つ間。',
      line: 'I have *my own subcommittee* now… *People are talking about it.*',
      said: '「自分の小委員会を持ったの。みんな話題にしてる」と言い、母の反応を待つ。',
      mean: '自慢を直接言わず、噂になっていると言って気づいてほしい。認めてほしい気持ち。',
      trap: '話題になる＝悪い噂と取ると「噂を止めて」に聞こえる。直前の自慢の続きとして聞く。',
      use: 'Word gets around fast here.（ここは噂が広まるのが早い）' },

    // R fix: V2 (blind 60 %): "you'd heard" doesn't fit "I'm sure" in the present, so grammar ruled it out; "you'll
    //   hear" fits the gap and differs only in its weak sounds
    // why: you heard ← the v is nearly silent before "heard"; you'll hear ← the weak "ve" heard as a dark l, and the d
    //   of "heard" lost before "something"
    { id: 's1', skill: 'sound', level: 'B2', point: 'heard', seg: [37.8, 40.9],
      stem: 'Fill the gap: “I’m sure ___ something about it.”',
      choices: ['you heard', 'you’ve heard', 'you’ll hear'], a: 1,
      cue: 'I’m sure のあと、you に付く小さな音。',
      line: 'I’m sure *you’ve heard* something about it.',
      said: '「きっともう何か聞いてるでしょ」と言う。',
      mean: 'you’ve は「ユv」とほぼ一音で、v は次の h に溶ける。もう聞いたかを確かめる現在完了。',
      trap: 'v が聞こえないと you heard に。you’ll なら「ウ」が残り、hear に d がない。',
      use: 'You’ve heard about the delay, right?（遅れの件、聞いてるよね）' },

    // R fix: V2 (blind 50 %): all three now start from her reaction to the "Mm", and only the next move differs
    // why: gets ready to leave ← "Oh, well" heard as giving up, as she pretended to leave before; takes it as a yes ←
    //   "Mm" read as agreement (相づち), so "anyway" sounds like a thank-you and wrap-up
    { id: 'm1', skill: 'marker', level: 'B2', point: 'anyway', seg: [40.8, 44.2],
      stem: 'After her mother only says “Mm”, how does Leslie carry on?',
      choices: ['She shrugs it off and gets to her real point', 'She shrugs it off and gets ready to leave',
                'She takes it as a yes and thanks her mother'], a: 0,
      cue: '母の短い返事のあと、文頭の一語。',
      line: '— Mm. — Oh, well. *Anyway*, we’re having a town hall meeting tomorrow',
      said: '母の「ふーん」に「まあいいや。で、明日集会をやるの」と続ける。',
      mean: 'anyway は話を先へ進める合図。反応がなくても、本当に言いたい話に移っている。',
      trap: '「とにかく」と訳すと話を打ち切ったように聞こえる。anyway のあとに本題が来ることが多い。',
      use: 'Anyway, where was I?（で、何の話だっけ）' },

    // why: 11 a.m. ← "seven" and "eleven" share -even; 6 p.m. ← the usual after-work start
    { id: 'n1', skill: 'number', level: 'B1', point: 'seven', seg: [42.95, 46.6], keep: true,
      stem: 'What time is the town hall meeting?',
      choices: ['11 a.m.', '6 p.m.', '7 p.m.'], a: 2,
      cue: 'tomorrow at のあと。',
      line: 'a town hall meeting tomorrow *at 7 p.m.*',
      said: '「明日の夜7時に、スミスフィールド公民館で集会がある」と言う。',
      mean: 'p.m. ＝ 午後。仕事のあとの時間に、住民向けの集会を開く。',
      trap: 'seven と eleven は後半の -even が同じ。頭に「イ」の音があるかで聞き分ける。',
      use: 'The meeting’s at 7 p.m. sharp.（集会は午後7時ちょうどです）' },

    // R fix: V2 (blind 85 %): the key was the only two-step reading; now all three are two-step, and one flips the order
    // why: flipped ← "no biggie" and "big deal" both said, so the order is easy to swap; scared ← "I'm leading it" plus
    //   the stammering heard as stage fright
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'biggie', seg: [46.6, 53.4],
      stem: 'What do Leslie’s words after “I’m leading it” show?',
      choices: ['She plays it down, then admits it matters to her', 'She calls it a big deal, then decides it isn’t',
                'She plays it down, then admits she’s scared of it'], a: 0,
      cue: 'no biggie のあと、言い直しの I mean。',
      line: 'It’s *no biggie*. I mean, it is, *it’s a big deal*.',
      said: '「大したことないの。いや、ある。っていうか、分かんない」と言い直す。',
      mean: 'no biggie ＝ 大したことない。すぐ言い直すのは、本当は大事だから。',
      trap: 'I don’t know を文字通り取ると「迷っている」に聞こえる。言い直しの向きを追う。',
      use: 'It’s no biggie. Happens all the time.（大したことないよ、よくあること）' },

    // R fix: V2 (blind 85 %): the key was the only feeling; now two near misses: the invitation as 社交辞令 and the
    //   sincerity flip (relief)
    // why: politeness ← "fake invited" read through the Japanese frame of a courtesy invitation (社交辞令); relieved ←
    //   "I know, I know" heard as glad agreement
    // anchor: 47.0–61.7 s she plays it down ("no biggie… it's a big deal"), asks "You want to come?", and only after
    //   "you know how busy I am" calls the invitation fake
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'fake', reveals: ['busy'], seg: [46.6, 62.4],
      stem: 'When Leslie says she “fake invited” her mom, what is she covering?',
      choices: ['That the no stung, since she meant the invite', 'That she only asked out of politeness',
                'That she is relieved her mother can’t come'], a: 0,
      cue: '断られた直後の言い方と、その前の誘い方。',
      line: 'You want to come? — …you know how busy I am. — I know, I know. That’s why I *fake invited* you.',
      said: '誘って「忙しいの」と言われると、すぐ「分かってる。だから誘ったふりをしただけ」と返す。',
      mean: '断られた痛みを隠すため、誘いを「ふり」にした。それまで何度も話を振っていたので、本気だったと分かる。',
      trap: '言葉どおり「社交辞令の誘い」と取りやすい。断られた直後の否定は、たいてい本音の裏返し。',
      use: 'I was only kidding anyway.（どうせ冗談だったし）' },

    // R fix: V2 + K1 (blind 80 %): "a yes, a bit late" was close to her later "I'll try to be there", so the stem now
    //   says "first answer"; the fillers became a wrong-reason no and a misread "you know"
    // why: short notice ← "tomorrow" was just said, so a no sounds like it's about timing; teasing yes ← "Oh, honey,
    //   jeez, you know…" heard as the start of "you know I'll come"
    { id: 'r2', skill: 'pragma', level: 'B2', point: 'busy', seg: [54.0, 58.75],
      stem: 'What is her mother’s first answer to the invitation?',
      choices: ['A soft no, put down to being busy', 'A soft no, put down to the short notice',
                'A teasing yes, as if it were obvious'], a: 0,
      cue: 'honey のあと、自分の予定についての一言。',
      line: 'Oh, honey, jeez, *you know how busy I am*.',
      said: '「あら、まあ、私がどれだけ忙しいか知ってるでしょ」と答える。',
      mean: 'はっきり no とは言わず、忙しさを理由にやんわり断っている。',
      trap: 'honey は優しい呼びかけなので、良い返事に聞こえる。呼びかけのあとの理由が本音。',
      use: 'Oh, you know how busy Fridays are.（金曜が忙しいの、知ってるでしょ）' },

    // R fix: V2 (blind 85 %): all three are now about the contractor, and differ in timing and tone
    // why: already built ← "thanks for coming down" and "I drove by one of your fences" heard as thanks for past work;
    //   joking ← "that fence looks awesome" heard as sarcasm
    { id: 'i2', skill: 'infer', level: 'B2', point: 'tom', seg: [67.7, 81.95],
      stem: 'What is Tom doing as people arrive?',
      choices: ['Flattering contractors he wants for the park', 'Thanking contractors who already built the park',
                'Joking with a contractor about his poor fences'], a: 0,
      cue: 'fences の話と、ほめ言葉の量。',
      line: 'getting *your fences* in there. I drove by one of your fences… *that fence looks awesome*.',
      said: '業者に「君のフェンスを入れたい。この前見たけど最高」と持ち上げる。',
      mean: 'まだ決まってもいない公園の仕事で、業者に気に入られようとしている。',
      trap: 'awesome を皮肉、thanks を過去へのお礼と取りがち。top priority は今後の話。',
      use: 'I’ve heard great things about your work.（お仕事の評判、聞いてます）' },

    // R fix: V2 (blind 60 %): the key was the only "idiom" choice; now two act it out, for opposite reasons
    // why: says sorry ← owning a criticism read through the Japanese frame (認める＝謝る); shoots the critics ← "gun"
    //   and "boom" heard as a threat
    { id: 'h1', skill: 'humor', level: 'C1', point: 'gun', seg: [81.6, 89.85],
      stem: 'Why is Tom’s answer to “some people” funny?',
      choices: ['He acts out the idiom to show he’s proud of it', 'He acts out the idiom to say sorry for rushing',
                'He pretends to shoot the critics who doubt him'], a: 0,
      cue: 'jumping the gun のあと、Here’s で始まる二文。',
      line: 'is *jumping the gun* a little bit. Well, guess what? *Here’s the gun, here’s me. Boom.*',
      said: '「早すぎと言う人もいる。じゃあ見て。これが銃、これが僕。ボン」と言う。',
      mean: 'jump the gun ＝ フライングする。批判を認め、跳び越えてみせて開き直る。',
      trap: 'gun と boom で脅しに聞こえやすい。決まり文句を文字通り演じる笑い。',
      use: 'Let’s not jump the gun here.（先走るのはやめよう）' },

    // R fix: V2 + §9.2 (blind 80 %): the stem quoted the rhetorical question under test; it now names the moment, and
    //   one distractor is the next speaker's view
    // why: depends ← the question form heard as a real "how much?"; be careful ← "A lot of them seemed to hate a park
    //   yesterday" is the next speaker's answer, not this one's
    { id: 'r3', skill: 'pragma', level: 'B2', point: 'hate', seg: [123.6, 129.25],
      stem: 'When Leslie asks if it will be fine, what does the reply mean?',
      choices: ['No need to worry; who could hate a park?', 'Hard to say; it depends on who shows up',
                'Be careful; some people really hate parks'], a: 0,
      cue: '質問の形だが、答えを待っているか。次の人の返しと分けて。',
      line: 'It’s a park, for God’s sakes. *How much can they hate a park?*',
      said: '「たかが公園だよ。公園をそこまで嫌える？」と励ます。',
      mean: '答えを求めない反語で「嫌うはずがない」。直後に「昨日はかなり嫌ってた」と返される。',
      trap: '次の人の「昨日は嫌ってた」と混ざりやすい。for God’s sakes と並ぶ疑問は答えの決まった反語。',
      use: 'How hard can it be?（そんなに難しいわけないでしょ）' },

    // R fix: V2 + S3 (blind 60 %; cue-leak test: "if" only in the key): three "speak up" choices; the cue no longer
    //   quotes "if"
    // why: speak up first ← "call on you" heard as being asked first; against the critics ← "negative" heard as people
    //   to attack, not a park to praise
    { id: 'd1', skill: 'detail', level: 'B1', point: 'april', reveals: ['sell'], seg: [128.75, 136.95],
      stem: 'What does Leslie want April to do at the meeting?',
      choices: ['Speak up for the park if the mood turns bad', 'Speak up first so the mood starts out good',
                'Speak up against the people who turn negative'], a: 0,
      cue: '質問の流れについての条件と、そのあとの頼み。',
      line: 'if the questions start getting *negative*… I need you to *sell the crap out of the park*.',
      said: '「質問が否定的になったら指名するから、公園を売り込んで」と頼む。',
      mean: '観客席の味方として、流れが悪くなったら公園を推す役をお願いしている。',
      trap: 'call on you を「最初に当てる」と取りやすいが、条件は if のあと。if の中身で時を決める。',
      use: 'If things get tense, back me up.（雰囲気が悪くなったら援護して）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'callon', seg: [131.4, 134.95],
      stem: 'Type what Leslie says: “I’m ___ you.” (3 words)', answer: 'gonna call on',
      cue: 'negative のあと、つながった3語。',
      line: 'if the questions start getting negative, I’m *gonna call on* you',
      said: '「質問が否定的になったら、あなたを指名する」と言う。',
      mean: 'gonna は going to。call on ＋ 人 ＝ 指名する。',
      trap: 'call on の l と o がつながり一語に聞こえる。on を落とすと「電話する」になる。',
      use: 'The teacher called on me first.（先生は最初に私を当てた）' },

    // R fix: V2 (blind 60 %): the trash filler was absurd; now "crap" read as the park's faults
    // why: best price ← "sell" taken literally; honest about problems ← "crap" read as the bad stuff, brought "out"
    { id: 'p1', skill: 'phrase', level: 'C1', point: 'sell', seg: [133.85, 136.95],
      stem: 'What does Leslie mean by the last part of her request?',
      choices: ['Praise the park as strongly as she can', 'Be honest about every problem with the park',
                'Get the best price she can for the park land'], a: 0,
      cue: 'I need you to のあとの、強める言い方。',
      line: 'I need you to *sell the crap out of the park*.',
      said: '「公園をとことん売り込んで」と頼む。',
      mean: 'sell ＝ 良さを売り込む。the crap out of ～ は「とことん」のくだけた言い方。',
      trap: 'sell を「売る」、crap を「悪いところ」と取りやすい。ひとまとまりで「思いきり」。',
      use: 'You need to sell yourself in interviews.（面接では自分を売り込まないと）' },

    // why: a flat no ← "Why?" heard as refusing; a keen yes ← Leslie's "good girl" sounds like she got a real yes
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'probably', seg: [136.3, 144.95],
      stem: 'How does April respond to Leslie’s request?',
      choices: ['With a half-hearted maybe', 'With a flat refusal', 'With a keen, happy yes'], a: 0,
      cue: '一回目と二回目の、短い返事。',
      line: '— *Why?* — Please, April, this is serious. Can you do that? — *Probably.*',
      said: '頼まれて「なんで？」、念を押されて「たぶん」とだけ答える。',
      mean: 'probably は「たぶんね」。乗り気ではないが、断ってもいない返事。',
      trap: '直後に Good girl とほめられるので、はっきり引き受けたように聞こえる。返事そのものの語で決める。',
      use: 'Will you come? — Probably.（来る？—たぶんね）' },

    // R fix: V2 (blind 90 %, with the header; about 65 % without): two "badly" choices now, and the Mark filler is gone
    // why: goes well ← most of the room seems to cheer, but for the opponent; her mother heckles ← her mother is there,
    //   and her comment to the camera ("train wreck") sounds like heckling
    { id: 'g2', skill: 'gist', level: 'B2', point: 'meeting', seg: [160.4, 327.4],
      stem: 'How does the town hall meeting go for Leslie?',
      choices: ['Badly: it keeps slipping out of her hands', 'Well: most of the room backs the park',
                'Badly: her mother starts to heckle her'], a: 0,
      cue: '反対意見、答えに詰まる場面、関係ない苦情の流れ。',
      line: 'And I am *100% against this park*… I have more of a comment than a question.',
      said: '反対派が拍手を集め、レスリーは詰まり、専門家の説明は短く、話は騒音の苦情へずれる。',
      mean: '公園の話を進めるはずが、主導権を失い続ける集会。最後は休憩で仕切り直す。',
      trap: '反対派への拍手を支持と聞きやすい。母の一言はカメラ向け。拍手の向きを聞く。',
      use: 'Let’s get back on track.（本題に戻りましょう）' },

    // R fix: V2 (blind 65 %): the key was the only negative choice; a second disapproving reading (career over family)
    //   now sits next to it
    // why: career over family ← "nothing wrong with being a wife and mother" heard as a rebuke; backs any path ←
    //   "nothing wrong with" heard as open-minded encouragement
    // anchor: 173.8–181.7 s she opens with "This is gonna be a train wreck", then joins "successful" to "nothing wrong
    //   with being a wife and mother" with "which is why": the advice is a fallback for a career she expects to fail
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'wifemom', seg: [173.3, 182.35],
      stem: 'In her comment to the camera, what is Leslie’s mother really saying?',
      choices: ['She doubts Leslie will make it in her career', 'She feels Leslie puts her career before family',
                'She’ll back Leslie whichever path she takes'], a: 0,
      cue: '最初の一文と、which is why のつながり。',
      line: 'This is gonna be a *train wreck*. I want my daughter to be successful, *which is why* I always tell her, there’s nothing wrong with being a wife and mother.',
      said: '「大失敗になる。娘には成功してほしい。だから、妻や母になるのも悪くないと言うの」。',
      mean: '「成功してほしい、だから家庭もいい」とつなぐのは、仕事では無理と見ているから。train wreck が答え。',
      trap: '「悪くない」を応援や家庭優先と取りがち。which is why のつながりを聞く。',
      use: 'Nothing wrong with a backup plan.（保険の案があっても悪くない）' },

    // R fix: V2 (blind 55 %): three parallel "Her X makes/admits…" choices
    // why: a slip ← "did not" heard as "did" (the not is quick); lazy ← "none of them were able to make it" heard as
    //   a complaint
    { id: 'h2', skill: 'humor', level: 'C1', point: 'exist', seg: [182.1, 196.4],
      stem: 'Why does Leslie’s point about her supporters get a laugh?',
      choices: ['Her denial makes them sound invented', 'Her excuse makes them sound lazy',
                'Her slip admits they were invented'], a: 0,
      cue: 'unfortunately のあと、頼まれていない否定。',
      line: 'None of them were able to make it tonight… *but they totally exist. I did not make them up.*',
      said: '「支持者は大勢いる。今夜は来られないけど、本当にいる。作り話じゃない」と言う。',
      mean: '誰も疑っていないのに「実在する」「作ってない」と言うと、かえって作り話に聞こえる。',
      trap: '否定を文字通り取ったり、自白と取ったりしやすい。聞かれない否定は疑いを招く。',
      use: 'I’m not making this up.（作り話じゃないよ）' },

    // R fix: V2 (blind 50 %): the key was the only procedural complaint; now all three say what the project skips
    // why: a vote ← "I live in the neighborhood" heard as "nobody asked us"; traffic ← "study" heard, the wrong kind
    { id: 'd2', skill: 'detail', level: 'B1', point: 'study', seg: [205.0, 214.65],
      stem: 'What is the resident’s main complaint about the project?',
      choices: ['It skips an environmental impact study', 'It skips a vote by the people who live nearby',
                'It skips a study of the extra traffic'], a: 0,
      cue: 'I cannot believe のあとの部分。',
      line: 'moving forward with the project *without a single environmental impact study*.',
      said: '「環境調査を一度もせずに進めるなんて」と怒る。',
      mean: 'environmental impact study ＝ 環境影響調査。手続き不足が反対理由。',
      trap: 'I live in the neighborhood で「住民に聞いていない」と取りやすい。',
      use: 'I can’t believe they did it without asking.（聞かずにやるなんて信じられない）' },

    // why: undersold ← "sold" heard as selling him cheap; too long ← "over-" heard as going over time
    { id: 'p4', skill: 'phrase', level: 'B2', point: 'oversold', seg: [257.3, 261.25],
      stem: 'What does Mark say about Leslie’s introduction?',
      choices: ['She praised him more than he deserves', 'She made him sound less able than he is',
                'She talked about him for far too long'], a: 0,
      cue: 'might have のあと、over で始まる動詞。',
      line: 'Leslie *might have oversold me* a little bit.',
      said: '紹介のあと「レスリーは僕を少し持ち上げすぎたかも」と言う。',
      mean: 'oversell ＝ 実際より良く言いすぎる。「何でも答えられる」と紹介されて、期待を下げている。',
      trap: 'sell を「安く売る」と取ると逆の意味になる。over- は「～しすぎ」。',
      use: 'I think I oversold the hotel.（ホテルを褒めすぎたかも）' },

    // R fix: V2 (blind 60 %): the pit filler was refuted by "I don't care about any of that"; all three are now
    //   "all night in his garage"
    // why: fixes cars ← "garage" and "all night" heard without "plays music"; lights on ← the same two keywords, read
    //   as a nuisance you can see
    { id: 'd4', skill: 'detail', level: 'B1', point: 'garage', seg: [285.9, 292.6],
      stem: 'What is the neighbor’s complaint about the man in the cast?',
      choices: ['He plays music all night in his garage', 'He fixes cars all night in his garage',
                'He leaves his garage lights on all night'], a: 0,
      cue: 'I don’t care about any of that のあと。',
      line: 'He’s the guy that *plays music all night in his garage*. It’s driving me nuts.',
      said: '「どうでもいい。あの人、ガレージで一晩中音楽をやってる」と言う。',
      mean: 'driving me nuts ＝ 気が変になりそう。公園と関係ない騒音の苦情。',
      trap: 'garage と all night だけだと、車や明かりの話にも聞こえる。直後の動詞を聞く。',
      use: 'That noise is driving me nuts.（あの音、ほんとイライラする）' },

    // R fix: V2 (blind 55 %): two "the birds are new" choices that differ in stance, and a "now"-missed reading
    // why: wants to see them ← the question heard as friendly interest; had them all along ← "now" missed, so the
    //   question sounds like he just forgot
    { id: 'i4', skill: 'infer', level: 'C1', point: 'birds', seg: [302.1, 312.85],
      stem: 'What does the question “You have birds now?” suggest?',
      choices: ['The birds are new, and he doubts the excuse', 'The birds are new, and he’d like to see them',
                'He forgot she has had birds all along'], a: 0,
      cue: '質問の最後の一語と、相手の答え方。',
      line: 'it’s *waking up my birds*. — You have birds *now*? — Yeah, I have birds.',
      said: '「鳥が起きちゃう」に「今は鳥を飼ってるの？」と聞き返され、むきになる。',
      mean: 'now は「前は飼ってなかったよね」。苦情のための新しい理由かと疑っている。',
      trap: 'now を聞き落とすと、ただの興味の質問に聞こえる。文末の now は「いつから？」の含み。',
      use: 'Wait, you play golf now?（え、今はゴルフやってるの？）' },

    // R fix: V2 (blind 60 %): all three now admit it, and differ in what follows
    // why: keep it down ← "guilty" heard as an apology with a promise; a fine ← "charged" heard as being charged money
    { id: 'p5', skill: 'phrase', level: 'B2', point: 'guilty', seg: [312.4, 318.8],
      stem: 'When Andy answers the complaint, what does he mean about the music?',
      choices: ['He admits it with a shrug, not sorry at all', 'He admits it and promises to keep it down',
                'He admits it and offers to pay a fine'], a: 0,
      cue: 'I do play rock and roll のあとの決まり文句。',
      line: 'I *do* play rock and roll. *Guilty as charged.*',
      said: '「役所の人じゃない。でもロックはやってる。その通り」と言う。',
      mean: 'guilty as charged ＝「おっしゃる通り」と軽く認める決まり文句。',
      trap: 'guilty で謝罪、charged で罰金と取りやすい。冗談まじりに認める言い方で、反省ではない。',
      use: 'Ate the last cookie? Guilty as charged.（最後のクッキー食べた？—はい、私です）' },

    // why: fifteen ← five's v runs into "minute"; ten ← the usual length of a break
    { id: 'n2', skill: 'number', level: 'B1', point: 'break', seg: [324.4, 327.4], keep: true,
      stem: 'How long a break does Leslie call?',
      choices: ['Five minutes', 'Ten minutes', 'Fifteen minutes'], a: 0,
      cue: 'let’s take a のあと。',
      line: 'Okay, let’s take a *five-minute* break, shall we?',
      said: '「では、5分休憩にしましょうか」と言う。',
      mean: 'five-minute の minute に s は付かない。脱線した場を休憩で仕切り直す。',
      trap: 'five の v が minute とつながり fifteen にも聞こえる。-teen なら後ろが強い。',
      use: 'Let’s take a ten-minute break.（10分休憩しよう）' },
  ]
};
