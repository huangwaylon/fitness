// “Tom and Jerry Go Old School | Parks and Recreation” (the official Parks and Recreation channel, Season 4): asked
// only to pick a new font, Tom pitches a full makeover, gets told off for dreaming big, sulks over Jerry's sandwich,
// then wins praise with an idea he got from Jerry's old ID card.
// REVIEW 2026-11-16: pass 0, fix 22, drop 0, new 0; ear checks 1
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 185 s.
// Untested: the captions garble 8.4–15 s ("Aaron more bored", "lighters", "a surprise one"); "I'd take" (whisper) vs
// "I take" (captions) at 30.8 s (i1's key rests on the "if" clause, in both); whisper drops "This is our new community
// center" at 58.7 s; "Ranger Reality Show" intro at 77–80 s is garbled in the captions; "30-some years" (whisper) vs
// "37 years" (captions) at 130 s; "my number four" vs "number for" at 175.8 s (no line shows it).
// EAR CHECK: 8.8 s a3 — whisper "I've never been more bored", captions "…more bored" without "never" (assumed
//   "never"; the key "bored" is in both, but a3's notes explain never + comparative)
import type { Clip } from '../types.ts';

export const oldSchool: Clip = {
  id: 'oldschool', video: 'DbBF91_b4eA', title: 'Tom and Jerry Go Old School', dur: 196, wpm: 170, band: 'mid',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 85 %; the title's "old school" pointed at the only retro choice): all three choices now look
    //   back to the old days
    // why: old signs ← "the old logo from the 1970s" + "posters" heard as bringing back old signage; Jerry's way ←
    //   "the exact same way every day" and "the credit goes to… Jerry" heard as Tom copying Jerry's routine
    { id: 'g1', skill: 'gist', level: 'B2', point: 'arc', reveals: ['credit', 'products'], seg: [0, 185.5],
      stem: 'How does Tom finally win praise for his work?',
      choices: ['He turns an old logo into limited-edition goods',
                'He brings back the parks’ old signs from the 1970s',
                'He starts doing the job Jerry’s same-old way'], a: 0,
      cue: '最後の企画の説明と、それへの反応。',
      said: '派手な改造案は注意されるが、ジェリーの古い ID カードで見たロゴを使う企画がほめられる。',
      mean: '大きく変える案ではなく、昔の物を生かす案で認められる、という流れ。',
      trap: '昔の物を使う点はどれも同じ。作るのは看板でなくグッズ。やり方のまねでもない。',
      use: 'Sometimes the old way works best.（昔のやり方が一番のこともある）' },

    // R fix: V2 (blind 70 %; "confused" was a filler): a distractor is now never + bored read as "never bored";
    //   S4 (the start cut "me"): seg starts 8.3
    // why: excited ← the Helvetica line "really popping for me" comes right before (another speaker); interested ←
    //   "never… bored" heard as a plain negative
    { id: 'a3', skill: 'attitude', level: 'B1', point: 'bored', seg: [8.3, 11.6],
      stem: 'When the talk about fonts stops, how does the next speaker feel?',
      choices: ['Bored; it’s the dullest talk he’s heard', 'Interested; fonts never bore him',
                'Excited; the letters really pop for him'], a: 0,
      cue: '「Ugh」のあとの一文。',
      line: 'Ugh, I’ve never been *more bored* in my entire life.',
      said: '「うわ、人生で一番退屈。文字なんて誰が気にする？」と言う。',
      mean: 'never been more bored ＝ 今までで一番退屈。否定＋比較級で最上級の意味。',
      trap: 'never で「退屈じゃない」と取りやすい。never ＋ 比較級は「一番〜」。',
      use: 'I’ve never been more tired in my life.（人生で一番疲れた）' },

    // R fix: V2 (blind 80 %; "font choices far too dull" was weak): a distractor is now the budget, the usual
    //   government-office objection
    // why: cost ← the usual objection to a big makeover in a government office; copying ← "the Sopranos option"
    //   sounds like borrowing from a TV show
    { id: 'g2', skill: 'gist', level: 'B2', point: 'assign', reveals: ['font'], seg: [15.0, 99.2],
      stem: 'Why does Tom’s first pitch get pushback?',
      choices: ['It goes far beyond the small task Chris set', 'It would cost far more than the department has',
                'It borrows its look from a famous TV show'], a: 0,
      cue: '反対する側が何度もくり返す点。',
      said: 'トムは制服や看板まで変える案を語るが、ジェリーは「頼まれたのはフォントだけ」とくり返す。',
      mean: '中身の良し悪しより、課題の範囲を大きく外れていることが問題。',
      trap: 'Sopranos や予算が浮かびやすいが、お金の話は出ない。理由は「頼まれていない」。',
      use: 'That’s outside the scope of this project.（それはこの案件の範囲外だよ）' },

    // R fix: V2 (blind 75 %; "hand in soon" was a filler): a distractor is now checking with Chris, after "what Chris
    //   asked us to do"
    // why: check with Chris ← "this really isn't what Chris asked us to do" heard as a reason to ask him; stay together
    //   ← "stick" heard as "stick together"
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'stick', seg: [25.2, 30.4],
      stem: 'What does Jerry suggest they do instead?',
      choices: ['Do only what they were asked to do', 'Check with Chris before going further',
                'Stay together on the project'], a: 0,
      cue: '「maybe we should just」のあと。',
      line: 'maybe we should just *stick to the assignment*.',
      said: '「これはクリスに頼まれたことじゃない。課題どおりにやろうよ」と言う。',
      mean: 'stick to ＝ 〜から外れない、〜を守る。予定・計画・ルールにも使う。',
      trap: 'stick together（団結する）や、クリスに確認と混ざりやすい。to のあとが守る対象。',
      use: 'Let’s stick to the plan.（計画どおりにいこう）' },

    // R fix: V2 (blind 70 %; "if Jerry asked more nicely" was a filler, and only the key said "dull"): a distractor
    //   now takes the words as resigned agreement
    // why: he will ← "Cool, Jerry. I'd take your advice" heard without the "if"; resigned ← the right words, read as
    //   "I'll do it and become a drone"
    { id: 'i1', skill: 'infer', level: 'C1', point: 'drone', seg: [29.9, 34.5],
      stem: 'What does Tom mean in his reply to Jerry’s suggestion?',
      choices: ['He won’t follow it; it would make him dull', 'He will follow it; Jerry has a fair point',
                'He will follow it, though it will make him dull'], a: 0,
      cue: '「advice」のあとに続く if の中身。',
      line: 'Cool, Jerry. I’d take your advice *if I wanted to be a dead-eyed government drone*…',
      said: '「いいね。死んだ目の役人ロボになりたいなら、従うよ」と返す。',
      mean: 'if 以下はなりたくない姿なので、「従わない」という意味。Cool も皮肉。',
      trap: 'I’d take your advice だけだと賛成か渋々の同意に聞こえる。if 以下まで聞く。',
      use: 'I’d agree, if I wanted to be bored.（退屈したいなら賛成だけどね）' },

    // R fix: V2 (blind 55 %): key reworded off the line's words; a distractor is now "a big step up"
    // why: step up ← "new job" heard as a promotion; his old company ← "my old job" mixed with "your old company",
    //   said later in the clip
    { id: 'i4', skill: 'infer', level: 'C1', point: 'oldjob', seg: [34.0, 41.0],
      stem: 'In his comment to the camera, what does Tom admit about his job?',
      choices: ['Officially, it is the job he had before', 'It is a big step up from his old job',
                'It is back at the company he used to run'], a: 0,
      cue: '「technically」のあとの言い方。',
      line: 'Yes, *technically, my new job is my old job*, but…',
      said: '「厳密には新しい仕事は前と同じ。でもジェリー型じゃない」と言う。',
      mean: 'technically ＝ 形の上では。認めたくない事実を認め、but のあとで言い訳する。',
      trap: 'new job から昇進と取りやすい。technically は渋々認める合図。',
      use: 'Technically, I’m still on vacation.（一応、まだ休暇中なんだけどね）' },

    // R fix: V2 (blind 60 %; "current" in the stem settled the tense): the stem quotes only the question; S4 (the end
    //   cut "They're"): seg ends 76.95
    // why: were ← "are" shrinks to a schwa, so a past form fits the gap; where ← "what" and "where" share the w- start
    { id: 's2', skill: 'sound', level: 'B2', point: 'rangers', seg: [71.0, 76.95],
      stem: 'Fill the gap: “___ up to? No one cares.”',
      choices: ['What are they', 'What were they', 'Where are they'], a: 0,
      cue: '「current park rangers」のあと、短い問い。',
      line: '*What are they* up to? No one cares.',
      said: '「今のレンジャーたち。何をしてる？誰も気にしない。退屈で大嫌い」と言う。',
      mean: 'What are they は「ワラゼイ」のようにつながる。are はほぼ消える。',
      trap: 'are が弱いので were と混ざりやすい。今の話なので現在形、と場面でも確かめる。',
      use: 'What are you up to this weekend?（今週末なにするの？）' },

    // why: logo ← the Sopranos logo is the first idea shown; color scheme ← Tom's makeover lists a "new color scheme"
    // R fix: S4 (the end cut "I mean"): seg ends 85.2
    { id: 'd1', skill: 'detail', level: 'B1', point: 'font', seg: [81.4, 85.2],
      stem: 'What did Chris actually ask the team to do?',
      choices: ['Choose a new font', 'Choose a new logo', 'Choose a new color scheme'], a: 0,
      cue: '「he just wanted us to」のあと。',
      line: 'Chris, he just wanted us to *choose a new font*.',
      said: '「ごめん、トム。でもクリスは新しいフォントを選んでほしかっただけ」と言う。',
      mean: 'just ＝ 〜だけ。頼まれた範囲が小さいことを強調している。',
      trap: 'ロゴや配色はトムが広げた話。wanted us to のあとの動詞と名詞を聞く。',
      use: 'She just wanted us to sign here.（ここにサインしてほしかっただけ）' },

    // R fix: V2 (blind 75 %; "over the budget" was weak): a distractor is now the other sense of off track (losing
    //   the thread of a talk); S4 (the start cut "sorry", the end cut "Well"): seg now 81.4–86.75
    // why: behind ← "off track" heard as "behind schedule"; lost the thread ← "get off track" is also used for a talk
    //   that wanders
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'track', reveals: ['font'], seg: [81.4, 86.75],
      stem: 'What does Jerry say Tom has done with the project?',
      choices: ['Drifted far from what was asked', 'Fallen far behind on the work', 'Lost the thread of his own pitch'],
      a: 0,
      cue: '「new font」のあと、たとえの言い方。',
      line: 'you’ve gone *way off track*.',
      said: '「フォントを選ぶだけだったのに、本当に大きく脱線してる」と言う。',
      mean: 'off track ＝ 本来の道から外れた。way は「かなり」と強める語。',
      trap: 'track を「予定」と取ると遅れ、話の脱線とも取れる。直前の「フォントだけ」と合わせる。',
      use: 'Sorry, I got off track. Where was I?（ごめん、脱線した。どこまで話したっけ）' },

    // R fix: S4 (the start cut "dreamer"): seg starts 88.0
    { id: 'x2', skill: 'dict', level: 'B1', point: 'dream', seg: [88.0, 90.9],
      stem: 'Type what Tom says: “I dream big. ___.” (3 words)', answer: 'deal with it',
      cue: '「I’m a dreamer」のあと、最後のひと言。',
      line: 'I’m a dreamer, okay? I dream big. *Deal with it.*',
      said: '「僕は夢見る男なんだ。大きな夢を見る。文句言うな」と言い返す。',
      mean: 'Deal with it ＝ 受け入れろ、慣れろ。開き直った、きつめの一言。',
      trap: '3語がつながり「ディーウィズィッ」に。deal の l と最後の t が弱い。',
      use: 'It’s raining. Deal with it.（雨だよ。あきらめて）' },

    // R fix: V2 (blind 60 %): choices reworded so the key isn't the only one about the job; S4 (the start cut "it"):
    //   seg now 90.4–94.85
    // why: work on it ← "weekends" + "dreaming" heard as advice to plan over the weekend; rest ← "dreaming" read as
    //   switching off after a long week
    { id: 'pr1', skill: 'pragma', level: 'C1', point: 'weekends', seg: [90.4, 94.85],
      stem: 'What is the point of the remark to Tom about weekends?',
      choices: ['Big ideas don’t belong in this job', 'Polish the big plan over the weekend',
                'Take a break; he’s been working too hard'], a: 0,
      cue: '「government」が2回出る、続く2文。',
      line: 'Tom, *weekends are for dreaming*. You are a government worker.',
      said: '「トム、夢を見るのは週末に。君は公務員で、これは役所の仕事だ」と言われる。',
      mean: '「夢は仕事の外で」という注意。続く2文で、ここは地道な役所だと念を押す。',
      trap: '週末に企画を練れ、という助言に聞こえやすい。続く government の2文が理由。',
      use: 'Save it for the weekend.（それは週末にとっておいて）' },

    // R fix: V2 (blind 75 %; "Plus," made the rhetorical form the natural one): stem starts at the gap; S4 (the start
    //   cut "job", the end cut "company"): seg now 94.75–99.9
    // why: is ← the n't of "isn't" fades before "dreaming"; wasn't ← "old company" pulls toward the past
    { id: 's1', skill: 'sound', level: 'B2', point: 'trouble', seg: [94.75, 99.9],
      stem: 'Fill the gap: “___ dreaming big exactly what got you in trouble?”',
      choices: ['isn’t', 'is', 'wasn’t'], a: 0,
      cue: 'Plus のすぐあと、短い一語。',
      line: 'Plus, *isn’t* dreaming big exactly what got you in trouble…?',
      said: '「それに、大きな夢こそ前の会社でつまずいた原因じゃない？」と言う。',
      mean: 'isn’t で始まる問いは「〜でしょ？」と同意を迫る形。t はほぼ聞こえない。',
      trap: 'n’t が弱く is に聞こえやすい。is なら単なる質問で、迫る響きがなくなる。',
      use: 'Isn’t that the guy from the hotel?（あれ、ホテルにいた人じゃない？）' },

    // R fix: V2 (blind 80 %; "asking him back" was a filler): a distractor is now "quit to dream bigger"; S4: seg as s1
    // why: lazy ← "trouble with your old company" heard as being fired, for the usual reason; quit ← "dreaming big" +
    //   "old company" heard as why he left
    { id: 'i2', skill: 'infer', level: 'C1', point: 'trouble', seg: [94.75, 99.9],
      stem: 'What does the question about Tom’s old company suggest about his past?',
      choices: ['His last big plans ended badly for him', 'His old company fired him for being lazy',
                'He quit his old company to dream bigger'], a: 0,
      cue: '「exactly what」のあと。',
      line: 'isn’t *dreaming big exactly what got you in trouble* with your old company?',
      said: '「大きな夢こそ、前の会社での失敗の原因でしょ？」と言われる。',
      mean: '前の会社では大きな夢が裏目に出た、という前提の問い。だから今回も注意される。',
      trap: 'trouble を「怠けてクビ」、夢を「辞めた理由」と取りやすい。原因は dreaming big。',
      use: 'That’s exactly what got us lost last time.（前回迷ったのはまさにそれのせい）' },

    // R fix: V2 (blind 55 %; "means the opposite" flagged sarcasm): choices no longer gloss "terrific"; S4 (the end
    //   cut "terrific"): seg ends 116.15
    // why: grateful ← "terrific" taken at face value, and "always makes me feel better" comes just before; not hungry
    //   ← "sounds terrific" read as a polite way to turn food down (遠慮)
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'sandwich', seg: [105.0, 116.15],
      stem: 'How does Tom react to Jerry’s sandwich?',
      choices: ['Gloomily; the treat sums up his sad new life', 'Gratefully; the treat is just what he needed',
                'Politely; he takes it though he isn’t hungry'], a: 0,
      cue: '「terrific」の前の一文。',
      line: '*Two pathetic guys eating pathetic sandwiches.* Sounds terrific.',
      said: '差し入れに「さえない男2人がさえないサンドを食べる。最高だね」と言う。',
      mean: 'pathetic（みじめな）を2回言ってから terrific。ほめ言葉はここでは皮肉。',
      trap: 'terrific だけだと喜んで聞こえる。直前の文で本気かどうか決める。',
      use: 'Another meeting. Sounds terrific.（また会議か。最高だね）' },

    // why: two ← "two pathetic guys" is said just before; four ← a close count, caught as "for" in fast speech
    // R fix: S4 (the start cut "terrific"): seg starts 116.15
    { id: 'n1', skill: 'number', level: 'B1', point: 'daughters', seg: [116.15, 125.2], keep: true,
      stem: 'In Tom’s picture of Jerry’s life, how many daughters are there?',
      choices: ['Two', 'Three', 'Four'], a: 1,
      cue: '「home-cooked meal with my」のあと。',
      line: 'a home-cooked meal with my *three beautiful daughters*.',
      said: '「妻にキスして、3人の美しい娘と手料理を食べる」と想像する。',
      mean: 'three の th は舌を軽くかむ音。free や tree とまぎれやすい。',
      trap: '直前の Two pathetic guys の two が残りやすい。数の直後まで聞く。',
      use: 'I have three older sisters.（姉が3人いる）' },

    // R fix: V2 (blind 70 %; "too tired" was a filler): a distractor is now the list heard as chores; S4 (the start
    //   cut "terrific", the end cut Jerry's "I"): seg now 116.15–128.05
    // why: dreads home ← "miserable" taken as his real view of family life; chores ← "boring house, kiss my wife"
    //   heard as a list of duties
    { id: 'h1', skill: 'humor', level: 'C1', point: 'miserable', reveals: ['daughters'], seg: [116.15, 128.05],
      stem: 'Why does Tom’s last line about Jerry’s life get a laugh?',
      choices: ['The life he calls miserable sounds lovely', 'He admits he dreads going home to a family',
                'He lists the dull chores of a married man'], a: 0,
      cue: '並べた中身と、最後の一言の差。',
      line: 'kiss my wife… my *three beautiful daughters*. *What a miserable life.*',
      said: 'ジェリーになったつもりで、妻にキス、娘と手料理、と並べて「なんてみじめな人生」と言う。',
      mean: '並べたのはどれも幸せな場面。それを「みじめ」と呼ぶずれが笑い。',
      trap: 'miserable を本当の気持ちと取りやすい。中身と評価が合わないときは笑いのしかけ。',
      use: 'Free food all day? Sounds awful.（一日中ただ飯？ひどい話だね）' },

    // R fix: V2 (blind 65 %; only the key was self-aware): choices reworded in parallel; S4: seg as h1
    // why: Jerry ← Tom means to mock Jerry's dull life, so the joke seems aimed where he aims it; married men ←
    //   "boring house… miserable" heard as a dig at family life in general
    // anchor: 116.2–127.8 s "I guess I'm Jerry now… kiss my wife… my three beautiful daughters. What a miserable life.":
    //   every item he lists is warm ("beautiful", "home-cooked"), so the only one who finds it miserable is Tom
    // retired: with nt2 (one C2 alone is under the tier's 2)
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'miserable', reveals: ['daughters'], seg: [116.15, 128.05], retired: true,
      stem: 'In Tom’s “I guess I’m Jerry now” speech, who is the joke on?',
      choices: ['Tom, whose idea of misery is a happy home', 'Jerry, whose home life really is that dull',
                'Married men, whose evenings are all the same'], a: 0,
      cue: '並べた語が、良い意味か悪い意味か。',
      line: 'I guess I’m Jerry now… *kiss my wife*… *home-cooked meal*… What a miserable life.',
      said: '「僕もジェリーか」と言い、家に直行、妻にキス、娘と手料理、と並べて「みじめだ」と結ぶ。',
      mean: 'トムはジェリーを見下すつもりだが、並べたのは温かい暮らし。見下すほど、トムの感覚のずれが笑われる。',
      trap: '話し手がばかにする相手が、笑いの的とは限らない。並べた語が良い意味なら、的は話し手のほう。',
      use: 'Poor me, stuck on a beach all week.（かわいそうな私、一週間ずっとビーチ）' },

    // R fix: S4 (the end ran into "Put my Sammy"): seg ends 146.05
    { id: 'x1', skill: 'dict', level: 'B1', point: 'gotta', seg: [143.0, 146.05],
      stem: 'Type what Tom says: “Oh my God. — Mm-hmm. — ___.” (3 words)', answer: 'i gotta go',
      cue: '「Mm-hmm」のすぐあと。',
      line: 'Oh my God… *I gotta go.*',
      said: '「なんてこった」と言い、「行かなきゃ」と急に席を立つ。',
      mean: 'gotta ＝ got to（＝ have to）。t が弾んで「ガラ」のように聞こえる。',
      trap: 'gotta を get や got と書きたくなる。got to が縮まり一語に聞こえる。',
      use: 'Sorry, I gotta run.（ごめん、もう行かなきゃ）' },

    // R fix: V2 (blind 70 %; only the key was merchandise, with "limited-edition"): all three are now lists of
    //   things; S4 (the end cut "People"): seg ends 158.45
    // why: uniforms, caps ← Tom's first makeover listed "new uniforms", and caps ≈ hats; signs ← "new signage" from
    //   the same list
    { id: 'd3', skill: 'detail', level: 'B1', point: 'products', seg: [151.6, 158.45],
      stem: 'What does Tom plan to make with the old 1970s logo?',
      choices: ['Hats, posters and T-shirts', 'Uniforms, badges and caps', 'Signs, banners and maps'], a: 0,
      cue: '「we make」のあとに並ぶ物。',
      line: 'we make *limited-edition hats, posters, T-shirts*, everything.',
      said: '「70年代の古いロゴで、限定版の帽子やポスター、T シャツを作る」と提案する。',
      mean: 'limited edition ＝ 数量限定品。昔のロゴを限定グッズにして売り出す案。',
      trap: '最初の大改造案（制服・看板）と混ざりやすい。今回は作る物が具体的に並ぶ。',
      use: 'Is this a limited edition?（これ限定品ですか）' },

    // R fix: V2 (blind 70 %; "buy the limited hats" was weak): a distractor is now "show their kids", after "growing
    //   up"; S4 (the start cut "editions", the end cut "This"): seg now 160.2–165.25
    // why: show their kids ← "the fun they had growing up" heard as a family visit to old places; classes ← katakana
    //   レクリエーション, heard in "recreate"
    { id: 'd4', skill: 'detail', level: 'B2', point: 'nostalgia', seg: [160.2, 165.25],
      stem: 'In Tom’s plan, why will parents want to go to the parks?',
      choices: ['To relive the fun they had as kids', 'To show their kids the parks they grew up in',
                'To sign up for new recreation classes'], a: 0,
      cue: '「nostalgia」のあと、want to go の理由。',
      line: 'swept up with *the nostalgia*… to *recreate the fun they had growing up*.',
      said: '「親は懐かしくなり、子どもの頃の楽しさを求めて公園に来る」と言う。',
      mean: 'recreate ＝ 再現する。growing up ＝ 子どもの頃。',
      trap: 'recreate がレクリエーションに聞こえやすい。目的語は the fun で、子どもの話ではない。',
      use: 'This song brings back so many memories.（この曲、懐かしいな）' },

    // R fix: V2 (blind 55 %; the key was the only two-sided choice): both distractors are now two-sided near misses;
    //   S4 (the start cut "terrific"): seg starts 172.95
    // why: advice though dull ← "words of wisdom" + "yammering" heard as thanks for advice he found boring (right
    //   sincerity, wrong target); tease ← "yammering on about whatever" heard as pure mockery
    // anchor: 177.7–182.2 s "he shared some words of wisdom… while he was yammering on about whatever, I happened to
    //   see his old ID card": the thanks is real, but it's for the card, not for the words
    // retired: never drawn under g1, which reveals its point (credit), so play 4 under g1 had no C2 to give
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'credit', seg: [172.95, 184.6], retired: true,
      stem: 'How should Jerry take the credit Tom gives him?',
      choices: ['As thanks for the card, not for his advice', 'As thanks for his advice, though Tom found it dull',
                'As a joke; the thanks is only there to tease him'], a: 0,
      cue: '「words of wisdom」と「while」以下の差。',
      line: 'the credit goes to… Jerry… while he was *yammering on about whatever*, I happened to see his old ID card.',
      said: '手柄はジェリーにと言い、「彼がしゃべる間に古い ID カードが見えた」と続ける。',
      mean: '感謝は本物だが、役立ったのはカード。yammer on（だらだら話す）で、話は聞いていなかったと分かる。',
      trap: 'お礼を助言へのもの、yammering で全部皮肉、と取りやすい。何への感謝かを聞く。',
      use: 'Thanks for the ride, if not the music.（音楽はともかく、送ってくれてありがとう）' },

    // R fix: V2 (blind 85 %; the oddly specific key stood out): a distractor is now "his first day", from Jerry's
    //   card line; S4 (the start cut "Jerry", the end cut "Thanks"): seg now 176.75–182.75
    // why: wisdom ← "he shared some words of wisdom with me" is said first, as if it led to the idea; first day ←
    //   Jerry showed the card as the one "for my first day on the job"
    { id: 'd2', skill: 'detail', level: 'B2', point: 'credit', seg: [176.75, 182.75],
      stem: 'According to Tom, what actually gave him the idea?',
      choices: ['Seeing Jerry’s old ID card', 'Hearing Jerry’s words of wisdom', 'Hearing about Jerry’s first day'],
      a: 0,
      cue: '「while he was」のあと。',
      line: 'while he was yammering on about whatever, *I happened to see his old ID card*.',
      said: '「彼がしゃべる間に、たまたま古い ID カードが見えた」と言う。',
      mean: 'ヒントは話ではなく、カードの昔のロゴ。happened to ＝ たまたま。',
      trap: 'words of wisdom が先で、助言がヒントに聞こえる。きっかけは while 以下。',
      use: 'I happened to see it on the way.（途中でたまたま見かけた）' },
  ]
};
