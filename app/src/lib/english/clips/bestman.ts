// “I Thought You Were My Friend! | Parks and Recreation” (the official Parks and Recreation channel, Season 5): the
// friends give Chris a "best man" award and act out a pretend bachelor party set in 2018; Andy's turn drifts into a
// melodrama in which Chris marries April, the group steers it back, and Chris says what he wants in a partner now.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Chris (21.9 s), April (30.3, 35.8 s).
// Andy is never named; the April part (29.6–68 s) is his because he calls April "my wife" (63.2 s). No item turns on
// who says "Strange, but sweet" (40.6 s), "I thought you were my friend!" (71.4 s) or "Ah, that's sweet" (99.5 s).
// Untested: 97.8 s ("are" / "R+"), 101.4 s ("take care of April" in the captions, "Take care, April" in whisper),
// 103 s on (music). The captions drop "Okay" and "in" at 56.7–57.8 s (p1's line follows whisper; its key doesn't
// turn on them).
// EAR CHECK: 10.3 s s1 — “you've never been” (both agree): is the 've audible, against “you'll never be”?
// EAR CHECK: 52.4 s s2 — “I have to” twice (both agree): reduced “hafta”, not “hate to” or “had to”?
// EAR CHECK: 69.8 s c2d — “Anyone else want to chime in?” (both agree): no “does” before it, four words run together?
// REVIEW 2026-11-16: pass 8, fix 15, drop 0, new 0; ear checks 0
// REVIEW open: g2, d1 and d2 still lean on the sitcom's usual arc (a cold reader got them at 55 %); n2's 2080 stays
//   an outlier, since -teen/-ty is the point
// REVIEW: the ear checks for s1, s2 and c2d were taken off (both sources agree on the words; the addendum's rule)
import type { Clip } from '../types.ts';

export const chrisBestMan: Clip = {
  id: 'bestman', video: '0GUGPA9V1UE', title: 'I Thought You Were My Friend!', dur: 123, wpm: 153, band: 'mid',
  tags: ['友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 55 % right): "act out a pretend party" was the only odd, playful choice; now worded plainly
    // why: best man at a wedding ← "the award for best man" heard as the wedding role he's being asked to play;
    //   real party ← "bachelor party" is said, and a surprise visit looks like party planning
    { id: 'g1', skill: 'gist', level: 'B2', point: 'purpose', reveals: ['own'], seg: [0, 24.5],
      stem: 'Why have the friends come to see Chris?',
      choices: ['To imagine his wedding and act out the night before', 'To ask him to be the best man at a wedding',
                'To plan a real bachelor party for next week'], a: 0,
      cue: '「bachelor party」のあと、話がどこへ飛ぶか。',
      line: 'you didn’t get your own bachelor party, but *let’s look ahead*. … *tomorrow, Chris Traeger’s getting married*.',
      said: '結婚歴がないので独身最後のパーティーもなかった。だから未来を想像しよう、と始める。',
      mean: '本物の計画ではなく、結婚前夜を空想で演じるお祝いの遊び。',
      trap: 'best man などで本物の式の話に思える。look ahead から空想に入る。',
      use: 'Let’s look ahead to next summer.（来年の夏のことを考えてみよう）' },

    // R fix: V2 (blind 55 % right): the key was the only "won, but" choice; "won easily" swapped for a near miss that
    //   keeps the win and flips whom the vote went to
    // why: came second, so didn't win ← "second" heard as the result (scope: his own vote vs the award); edged out
    //   Ryan ← "close second" caught, but the roles of Ryan and Chris in the vote swapped
    // anchor: 3.1–9.4 s "you have won the award" + "I voted for Ryan Gosling, but you came in a close second": the award
    //   is Chris's, and "I voted" is one person's ballot
    { id: 'c2v', skill: 'infer', level: 'C2', point: 'vote', seg: [2.6, 10.0],
      stem: 'Which plain-English version keeps what the friend tells Chris about the award?',
      choices: ['“You won, though you weren’t my own first pick.”', '“You came second, so you didn’t really win.”',
                '“You won, and you just edged out Ryan in my vote.”'], a: 0,
      cue: '「won」と「I voted」の主語を比べて。',
      line: 'You *have won* the award… Full disclosure, *I voted for* Ryan Gosling, but you came in *a close second*.',
      said: '「受賞おめでとう」のあと「正直、僕の票は別の人。君はわずかな差の2位」と付け足す。',
      mean: '賞は Chris のもの。2位は話し手1人の順位にすぎない。わざわざ白状して、祝いを自分で崩す冗談。',
      trap: 'second を結果と取ると「受賞していない」になる。数字が出たら、誰の数かを主語で確かめる。',
      use: 'Full disclosure: I already ate one.（正直に言うと、もう1個食べた）' },

    // R fix: V2/S1 (blind 50 % right): "own vote" hinted that his vote differed from the award; stem neutral now
    // why: first ← he did win the award, so "first" feels right; third ← a late-heard number word, and a joke
    //   ranking would put him lower
    { id: 'n1', skill: 'number', level: 'B1', point: 'vote', seg: [6.3, 10.0], keep: true,
      stem: 'Where does the speaker say Chris placed in his vote?',
      choices: ['First', 'Second', 'Third'], a: 1,
      cue: '「but you came in」のすぐあと。',
      line: 'I voted for Ryan Gosling, but you came in *a close second*.',
      said: '自分は別の人に投票したが、君は「わずかな差の2位」だった、と言う。',
      mean: 'come in second ＝ 2位になる。close second ＝ 1位に近い2位。',
      trap: '受賞の話なので1位と思いやすい。これは話し手1人の票。but のあとを聞く。',
      use: 'We came in second place.（2位だったよ）' },

    // R fix: V2 (blind 65 % right): "you'll never be" was cruel and odd, so out; "you'd never been" (a 'd/'ve weak
    //   form swap) in; the trap note follows
    // why: you'd never been ← 've and 'd both shrink to a bare consonant after "you"; you were never ← the same
    //   meaning, so only the sound decides
    { id: 's1', skill: 'sound', level: 'B2', point: 'never', seg: [9.0, 12.25],
      stem: 'Fill the gap: “Now, ___ married…”',
      choices: ['you’ve never been', 'you’d never been', 'you were never'], a: 0,
      cue: '「Now」のすぐあと、you に付く短い音。',
      line: 'Now, *you’ve never been* married, so…',
      said: '「君は結婚したことがないから」。you’ve の ’ve はごく弱い。',
      mean: '今までの経験の話。you’d never been なら過去のある時点までの話になる。',
      trap: '’ve も ’d も you に溶けて短い。v は唇でこする音、d は舌で弾く音。',
      use: 'I’ve never been to Hawaii.（ハワイには行ったことがない）' },

    // R fix: K2: "once engaged" couldn't be refuted from the words; now "married once", which "never been married"
    //   refutes
    // why: turned one down ← "didn't get" heard as a choice he made; married once ← "married" and "didn't get" heard
    //   without the "never"
    { id: 'i2', skill: 'infer', level: 'C1', point: 'own', seg: [9.6, 13.6],
      stem: 'From how the friend explains the missing party, what can we tell about Chris?',
      choices: ['He has been to other people’s bachelor parties', 'He once said no to having a bachelor party',
                'He married once, but had no bachelor party'], a: 0,
      cue: '「bachelor party」の直前の短い一語。',
      line: 'so you didn’t get *your own* bachelor party',
      said: '「だから自分の独身パーティーはなかった」と言う。',
      mean: 'your own ＝ 人のではなく自分の。人のパーティーには出たことがあると分かる。',
      trap: 'didn’t get を「断った」と取りやすいが、機会がなかっただけ。own の対比を聞く。',
      use: 'I finally got my own room.（やっと自分の部屋ができた）' },

    // R fix: V2 (blind 55 % right): "pretend story" pointed to the future and ruled out 2008; stem neutral now
    // why: 2008 ← "two thousand eight" is the other way to say a year, and the past would be a memory; 2080 ← -teen and
    //   -ty: "twenty eighteen" vs "twenty eighty"
    { id: 'n2', skill: 'number', level: 'B1', point: 'year', seg: [13.6, 17.1], keep: true,
      stem: 'What year does the friend say it is in the story?',
      choices: ['2008', '2018', '2080'], a: 1,
      cue: '「The year is」のあと。',
      line: 'The year is *2018*.',
      said: '「時は2018年」と、少し先の未来を舞台にする。',
      mean: '物語の語り出しの決まり文句。ここから空想の未来の話になる。',
      trap: 'eighteen と eighty は -teen と -ty の差。-teen は後ろが長く強い。年号は2桁ずつ聞く。',
      use: 'The year is 1985.（時は1985年）' },

    // R fix: V2 (blind 65 % right): "crazy about" gave the idiom away to anyone who knows nuts = crazy; choices now
    //   avoid "crazy", and the "wild" distractor carries the nuts = crazy trap
    // why: eats nuts ← "nuts" taken literally as food, with fitness nearby; a bit wild ← "nuts" = crazy, read as her
    //   personality instead of "nuts about"
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'nuts', seg: [23.0, 27.25],
      stem: 'In the first guess about the bride, what is she like?',
      choices: ['She loves exercise and keeping fit', 'She eats healthy snacks like nuts',
                'She is a little wild, but very fit'], a: 0,
      cue: '「upbeat gal」のあと、fitness の前。',
      line: 'Maybe she’s an upbeat gal who’s *nuts about* fitness.',
      said: '「明るくて、フィットネスに夢中な女の子かも」と想像する。',
      mean: 'be nuts about ～ ＝ ～に夢中だ、大好きだ。くだけた言い方。',
      trap: 'nuts を食べ物のナッツと取りやすい。about が続くと「夢中」。nuts だけなら「頭がおかしい」。',
      use: 'My dad is nuts about baseball.（父は野球に夢中）' },

    // R fix: V2 (blind 60 % right): the key was the only choice naming Andy; all three now turn on Andy and Chris
    // why: fight, Chris leaves ← an angry "I thought you were my friend!" heard as a real row; Chris upset ← "I
    //   forgive you" heard the other way round, as Andy making peace with a hurt Chris
    { id: 'g2', skill: 'gist', level: 'B2', point: 'arc', reveals: ['forgive'], seg: [24.0, 102.4],
      stem: 'How does the group’s story for Chris turn out?',
      choices: ['Andy turns it into his own drama, but it ends warmly', 'Andy turns it into a real fight, and Chris walks out',
                'Chris gets upset by it, and Andy makes it up to him'], a: 0,
      cue: '途中の脱線と、最後の Chris の答え。',
      said: '花嫁の想像が、Andy の死と妻の再婚の話に脱線する。最後は Chris の答えで和やかに終わる。',
      mean: 'お祝いの空想が一人の妄想に乗っ取られ、また元に戻る流れ。',
      trap: '怒った声と forgive で口論に見えるが、怒りは空想の中だけ。',
      use: 'Sorry, I got a little carried away.（ごめん、ちょっと調子に乗った）' },

    // R fix: V2 (blind 50 % right): "suspects feelings" was a weak, unkind outlier; now a rival reading
    // why: find someone ← "you've never been married" earlier, so the wish sounds like kindness to a lonely friend;
    //   rival ← "you go marry April" heard as a threat to Andy, not his wish
    { id: 'i1', skill: 'infer', level: 'C1', point: 'trust', reveals: ['like'], seg: [34.0, 40.55],
      stem: 'What does Andy’s wish about April and Chris show about his view of Chris?',
      choices: ['He trusts Chris more than other men', 'He wants Chris to finally find someone',
                'He sees Chris as his rival for April'], a: 0,
      cue: '「makes me sad」のあと、but に続く部分。',
      line: 'it makes me sad, but if she’s gonna be with somebody, *I’d like it to be you*.',
      said: '自分が死んだら悲しいけど、妻が誰かと一緒になるなら君がいい、と言う。',
      mean: '大事な人を任せられるほど、Chris を信頼しているということ。',
      trap: 'marry April だけ聞くと疑いに聞こえるが、but のあとが本音。I’d like は希望。',
      use: 'I’d trust you with my car.（君になら車を任せられる）' },

    // why: too sad ← "it makes me sad" just before; funny but long ← the story keeps going, so a "too long" reaction fits
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'strange', seg: [34.0, 42.0],
      stem: 'Right after the April part of the story, how is it received?',
      choices: ['As odd, but sort of touching', 'As touching, but too sad to hear', 'As funny, but a bit too long'],
      a: 0,
      cue: '「be you」のすぐあと、短い2語の感想。',
      line: '*Strange, but sweet.*',
      said: '「変だけど、優しいね」と短く感想を言う。',
      mean: '死んで妻を任せるという妙な話だが、気持ちはうれしい、という反応。',
      trap: '直前に sad が聞こえるので「悲しい」に引かれやすい。感想の2語は but の前後で分けて聞く。',
      use: 'Weird, but I like it.（変だけど、好きだな）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'like', seg: [37.4, 40.55],
      stem: 'Type what he says: “…with somebody, ___ you.” (5 words)', answer: "i'd like it to be",
      cue: '「somebody」のすぐあと、you の前まで。',
      line: 'but if she’s gonna be with somebody, *I’d like it to be* you.',
      said: '「誰かと一緒になるなら、それは君であってほしい」。',
      mean: 'like it to be が「ライキットゥビ」とつながる。it と to は弱く短い。',
      trap: 'I’d の d は消えやすく、I like に聞こえる。希望を言うときは I’d like の形。',
      use: 'I’d like it to be quiet tonight.（今夜は静かだといいな）' },

    // R fix: V2 (blind 55 % right): the key alone said what comes next ("a twist"); all three now name a job
    // why: "just" ← only = だけ, a small add-on; "also" ← heard as a plain next step in the story
    { id: 'm1', skill: 'marker', level: 'C1', point: 'only', seg: [41.6, 45.8],
      stem: 'What does the first word do as Andy picks his story back up?',
      choices: ['It works like “but”: a twist on what he said', 'It works like “just”: a small add-on to it',
                'It works like “also”: one more event in order'], a: 0,
      cue: '「Strange, but sweet」のあと、最初の一語。',
      line: '*Only*, I didn’t really die. I was faking it.',
      said: '「ただね、本当は死んでなかった。死んだふりだった」と話を続ける。',
      mean: '文頭の Only ＝「ただし」。前の話をくつがえす展開を出す合図。',
      trap: 'only は「だけ」で覚えがち。文頭でコンマが付くと but に近い。',
      use: 'It’s a great hotel. Only, it’s far.（いいホテルだよ。ただ遠いけど）' },

    // R fix: V2 (blind 50 % right): "Chris is his friend" swapped for the role swap of the key's own words
    // why: April forgot him ← he "faked" his death and spies from afar, so being forgotten fits; April makes Chris
    //   happy ← "you make her" with subject and object swapped
    { id: 'd1', skill: 'detail', level: 'B1', point: 'walk', seg: [45.6, 52.0],
      stem: 'In Andy’s story, why does he decide not to fight Chris?',
      choices: ['He sees how happy Chris makes April', 'He sees that April has forgotten him',
                'He sees how happy April makes Chris'], a: 0,
      cue: '「planning to」のあと、but に続く部分。',
      line: 'but I see *how happy you make her*…',
      said: '車から見張って殴るつもりだったが、君が彼女を幸せにしているのを見て、と言う。',
      mean: '彼女の幸せを見て身を引く、という映画のような筋書き。',
      trap: 'you make her の主語と目的語に注意。幸せなのは April。',
      use: 'I can see how happy you are.（すごく幸せそうだね）' },

    // why: had to ← he could be telling it in the past, and the d is soft; hate to ← "hafta" sounds close to "hate to"
    { id: 's2', skill: 'sound', level: 'B2', point: 'haveto', seg: [51.7, 55.6],
      stem: 'Fill the gap: “…and I ___ walk away.”',
      choices: ['have to', 'had to', 'hate to'], a: 0,
      cue: '「how happy you make her」のあと。',
      line: 'and I *have to* walk away. I *have to*.',
      said: '「身を引くしかない。そうするしかない」と2回言う。',
      mean: 'have to は「ハフタ」。v が f に近くなる。物語は現在形なので have。',
      trap: '「ハフタ」は hate to にも聞こえる。2回目は文末で少しはっきりする。',
      use: 'Sorry, I have to go.（ごめん、もう行かなきゃ）' },

    // why: says he didn't ← "And I do" heard as "I don't" (final consonant lost); rain on Chris ← the weather word
    //   attached to the wrong person
    { id: 'h1', skill: 'humor', level: 'C1', point: 'rain', seg: [51.7, 56.7],
      stem: 'What makes the end of Andy’s walk-away scene funny?',
      choices: ['He dresses up his daydream like a sad movie', 'He says he’d leave, then admits he never did',
                'He leaves Chris standing out in the storm'], a: 0,
      cue: '「walk away」のあと、歩き方と天気。',
      line: 'And *I do*, *slowly, in a rainstorm*.',
      said: '「そして去るんだ。ゆっくりと、嵐の中を」と付け足す。',
      mean: '空想なのに、雨の中を去る映画の名場面のような演出を足していく。その熱の入り方が笑い。',
      trap: 'I do を I don’t と聞くと「去らなかった」になる。don’t なら最後に t が残る。',
      use: 'And then, slowly, I walked away.（そして、ゆっくりと去った）' },

    // R fix: V2 (blind 60 % right): the key was the only soft, sensible move; distractors now as plausible
    // why: praise ← "spirit" read as 気持ち・熱意, so it sounds like a compliment; lost track ← "what we're
    //   trying to do" heard as the group not knowing what to do
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'spirit', seg: [56.0, 59.05],
      stem: 'When a friend speaks up after the rainstorm scene, what is he doing?',
      choices: ['Saying the story has gone off course', 'Praising the heart Andy puts into it',
                'Admitting they’ve lost track of the plan'], a: 0,
      cue: '「rainstorm」の直後、別の声の「Okay」から。',
      line: 'this isn’t really *in the spirit of what we’re trying to do*.',
      said: '「これは僕らのやりたいことのねらいとはちょっと違う」と口をはさむ。',
      mean: 'in the spirit of ＝ ねらいに合う。not really で柔らかく脱線を止める。',
      trap: 'spirit を「熱意」と取るとほめ言葉に聞こえる。否定を聞き逃さない。',
      use: 'That’s not really the point.（それはちょっと論点が違うかな）' },

    // R fix: V2 (blind 55 % right): "fade away" was a weak outlier; now "wear off", a near form of "eats away"
    // why: wear off ← "away" heard as gone; appetite ← "eats" taken literally
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'eats', seg: [58.6, 61.6],
      stem: 'As time goes by in Andy’s story, what happens to his feelings?',
      choices: ['They slowly wear him down', 'They slowly wear off for him', 'They slowly take his appetite'], a: 0,
      cue: '「as time goes by」のあと、at me で終わる部分。',
      line: 'But as time goes by, *it eats away at me*.',
      said: '「でも時がたつにつれて、それが僕をむしばんでいく」と続ける。',
      mean: 'eat away at ～ ＝ じわじわ苦しめる。悩みが少しずつ大きくなる感じ。',
      trap: 'eat を食欲、away を「消える」と取りやすい。at me が付くと「自分を苦しめる」。',
      use: 'The guilt was eating away at me.（罪悪感にずっと苦しめられていた）' },

    // why: living at her place ← "living" taken literally as 住む; married ← "you go marry April" earlier
    //   in the story
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'livingup', seg: [61.2, 68.6],
      stem: 'In Andy’s story, what is Chris doing with April while Andy trains?',
      choices: ['Going out and having a great time', 'Moving in and living at her place',
                'Getting married and settling down'], a: 0,
      cue: '「with my wife」の直前の言い方。',
      line: 'You’re out *living it up* with my wife, and I’m alone in a cave training.',
      said: '「君は僕の妻と派手に楽しんでいて、僕はほら穴でひとり特訓中」と言う。',
      mean: 'live it up ＝ 思いきり遊ぶ。自分のみじめさとの対比。',
      trap: 'living を「住む」と取りやすい。it up が付くと「楽しむ」。結婚の話は前の場面。',
      use: 'We lived it up in Vegas.（ラスベガスで思いきり遊んだ）' },

    // why: a toast ← "chime" is the ring of a glass, and this is a party; agree with Andy ← "chime in" heard as joining
    //   his side
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'chime', reveals: ['anyone'], seg: [67.0, 71.35],
      stem: 'Right after Andy’s cave line, what does a friend ask the others?',
      choices: ['If anyone else would like to add to the story', 'If anyone else would like to make a toast',
                'If anyone else agrees with what Andy said'], a: 0,
      cue: '「training」のあと、別の声の短い質問。',
      line: 'Anyone else want to *chime in*?',
      said: '「ほかに誰か、話に加わりたい人いる？」とほかの人に話をふる。',
      mean: 'chime in ＝ 会話に口をはさむ、発言する。脱線した話を止めて、別の人に回している。',
      trap: 'chime はベルやグラスの音なので乾杯を思いやすい。in が付くと「会話に入る」。',
      use: 'Feel free to chime in anytime.（いつでも話に入ってね）' },

    // anchor: 69.8–71.0 s both sources have "anyone else want to chime in" with no "does"; five words in ~1.2 s
    { id: 'c2d', skill: 'dict', level: 'C2', point: 'anyone', seg: [68.3, 71.35],
      stem: 'Type the question: “___ chime in?” (4 words)', answer: 'anyone else want to',
      cue: '「training」のあと。文法より、聞こえた音を。',
      line: '*Anyone else want to* chime in?',
      said: '「ほかに話したい人？」。文頭に Does はなく、4語がひと続きで速い。',
      mean: '会話では疑問文の Does がよく落ち、上がり調子だけで質問になる。want to も「ワナ」に近い。',
      trap: '文法どおりに Does を足したくなる。書き取りは正しい文でなく、言われた音を書く。',
      use: 'Anybody want coffee?（コーヒー飲む人？）' },

    // R fix: V2 (blind 60 % right): the key was the only one about the point; now a near miss (Andy's point) and a
    //   keyword trap ("someone into the same stuff")
    // why: Andy's point ← "what we're trying to say" heard as speaking for Andy; asks what he wants ← "meet somebody
    //   who's into the same stuff" heard as a question
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'point', seg: [73.5, 81.6],
      stem: 'Right after Andy’s outburst, what does the next speaker do?',
      choices: ['Sums up the group’s real point for Chris', 'Sums up Andy’s point for Chris more kindly',
                'Asks Chris what he wants in a partner'], a: 0,
      cue: '「Okay」のあと、文の最初の数語。',
      line: '*what we’re trying to say is* that you are a great guy',
      said: '「つまり、君は最高のやつで、いつか趣味の合う人に会える」と言う。',
      mean: 'what we’re trying to say is ＝ 話を本題に戻す前置き。',
      trap: '主語は we。Andy の話の言い直しではなく、みんなの本来の言いたいこと。',
      use: 'What I’m trying to say is, thank you.（つまり言いたいのは、ありがとうってこと）' },

    // R fix: V2 (blind 55 % right): the reversed choice ("used to want deeper values") was implausible; now a keyword
    //   trap on "into the same stuff", and "deeper" (an evaluative cue) is gone
    // why: never wanted ← "would've loved" missed, and the friend's "into the same stuff" taken as Chris's wish; still a
    //   fitness fan ← "would've loved" heard as "would love"
    { id: 'd2', skill: 'detail', level: 'B2', point: 'oldchris', seg: [81.5, 94.3],
      stem: 'How does Chris say his taste in partners has changed?',
      choices: ['He once wanted a fitness fan, but now wants good values',
                'He never wanted a fitness fan, just someone with his hobbies',
                'He still wants a fitness fan, as long as she values friends'], a: 0,
      cue: '「the old Chris」と、後半の but のあと。',
      line: 'the *old Chris would’ve loved* this super-fit health goddess… *now*, I just want someone that *values the important things*',
      said: '昔ならその女神に夢中だったが、今は大事なものを大切にする人がいい、と言う。',
      mean: 'would’ve loved は「昔なら好きだった」。今は価値観を重んじる。',
      trap: 'would love と聞くと「今も好き」になる。old と now の対比を追う。',
      use: 'The old me would’ve said yes.（昔の僕ならイエスと言ってた）' },

    // why: still hurt ← "forgive" implies there was a grudge, so some hurt may remain; cold goodbye ← the farewell
    //   words right after
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'forgive', seg: [98.8, 102.4],
      stem: 'How does Andy respond to what Chris says?',
      choices: ['He’s touched and lets go of his anger', 'He’s touched but still a little hurt',
                'He’s hurt and says goodbye coldly'], a: 0,
      cue: '「that’s sweet」のあと、bro で終わる一言。',
      line: 'Ah, that’s sweet. *I forgive you, bro*.',
      said: '「いい話だね。許すよ、兄弟」と言う。',
      mean: '空想の中の「裏切り」を本気で許してあげている。怒りはもうない。',
      trap: '許すと言うと、まだ根に持っているように聞こえやすい。bro の親しさも合わせて聞く。',
      use: 'It’s okay, man. I forgive you.（いいよ。許すよ）' },
  ]
};
