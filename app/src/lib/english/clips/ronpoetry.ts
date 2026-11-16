// REVIEW 2026-11-16: pass 7, fix 15, drop 0, new 0; ear checks 1
// OPEN: h1 (meat) and i2 (whisky) can still be guessed from knowing Ron; the audio settles both.
// “Poetry Does Nothing For Ron Swanson | Parks and Recreation” (the official Parks and Recreation channel, Season 6):
// Leslie gives Ron a train ticket and a plan for his trip; a letter praising Leslie plays in voice-over; Ron finds the
// one place in Europe he likes, then reads the poem Leslie asked for.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 182 s; whisper's repeated line after it
// is a hallucination. The Burns poem (149–173 s) is untested (old poetic English). No predict item (the cut before
// "but" at 21.8 s is too tight). No who item: the letter's voice isn't named in the audio, so no key rests on it.
// EAR CHECK: 61.0 s p2 — whisper “let the world wash over them”, captions “watch over them” (key assumes wash)
import type { Clip } from '../types.ts';

export const ronPoetry: Clip = {
  id: 'ronpoetry', video: 'OUpgxGheOug', title: 'Poetry Does Nothing For Ron Swanson', dur: 206, wpm: 188, band: 'fast',
  tags: ['旅行', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: "turns it down and heads home" was a filler (V2/K3); now his-own-find, from “much to my surprise”. Seg runs
    //   to the note at the cliffs, which shows the islands were her stop.
    // why: own find ← "it turns out… there is one place" heard as his own discovery; let down ← the title (poetry does
    //   nothing) read as the whole trip failing
    { id: 'g1', skill: 'gist', level: 'B2', point: 'plan', reveals: ['surprise', 'stay'], seg: [0, 147],
      stem: 'How does Leslie’s plan for Ron’s trip work out?',
      choices: ['It leads him to the one place he really loves', 'He skips her stops and finds a place himself',
                'He follows it, but every stop lets him down'], a: 0,
      cue: '最初の文句と、島での最後の一言をくらべる。',
      said: '最初は「この大陸にこれ以上いたいと思うか？」と言うが、計画どおり進んでスコットランドの島に着く。',
      mean: '島では「この旅は来る価値がある」と言う。ヨーロッパ嫌いの彼が本気で喜ぶ。',
      trap: '最初の文句だけで「断った」と思いやすい。旅の終わりの感想まで聞く。',
      use: 'Trust me, it’s worth the trip.（信じて、行く価値あるよ）' },

    { id: 'd1', skill: 'detail', level: 'B1', point: 'ticket', reveals: ['parts'], seg: [0, 9.2],
      stem: 'What is the first part of Leslie’s wedding gift?',
      choices: ['A train ticket', 'A plane ticket', 'A bus ticket'], a: 0,
      cue: '「Part one of many」のあと、ロンの聞き返し。',
      line: 'Part one of many. — A *train ticket*?',
      said: 'レスリーが結婚祝いを渡し、ロンが中を見て「列車の切符？」と聞き返す。',
      mean: 'ちゃんとした結婚祝いの「その1」。この切符で旅の続きが始まる。',
      trap: '旅行と聞くと飛行機を思い浮かべやすい。ticket の前の短い一語を聞く。',
      use: 'Two train tickets to Paris, please.（パリまで列車の切符を2枚）' },

    // R fix: "at the wedding" was refuted by "finally… a proper wedding gift" (after the wedding); now "once he's back
    //   home", the other reading of "many" (V2).
    // why: in pieces ← "part one" read as part of one object to put together; back home ← "many" read as more gifts
    //   later, the itinerary missed
    { id: 'i1', skill: 'infer', level: 'B2', point: 'parts', reveals: ['letter'], seg: [5.0, 19.9],
      stem: 'What does Leslie suggest about the gift when she hands it over?',
      choices: ['More of it is waiting for him along the way', 'It comes in pieces he must put together',
                'She’ll give him the rest once he’s home'], a: 0,
      cue: '渡すときの短い一言と、そのあとの itinerary。',
      line: 'Part one of many.',
      said: '「その1。まだまだ続くよ」と言い、日程表どおりに進めばがっかりしないと約束する。',
      mean: '切符は始まりで、旅の先々に次の贈り物が待っている、という予告。',
      trap: 'part を部品と取ると「組み立て」に聞こえる。後の itinerary が旅の話だと示す。',
      use: 'This is just part one.（これはまだ第1弾）' },

    // why: touched ← gruff men hiding feelings is the usual script; the cost ← "train ticket" + "extend my stay" read as
    //   money worries
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'stay', seg: [9.0, 14.3],
      stem: 'How does Ron react to the idea behind the gift?',
      choices: ['He hates the idea of staying longer', 'He’s touched, but hides it behind a joke',
                'He worries about what a longer stay costs'], a: 0,
      cue: '質問の形だが、最後の continent の前の形容詞。',
      line: 'You think I want to extend my stay on this *godforsaken continent*?',
      said: '「この見捨てられた大陸に、もっといたいと思うか？」と聞き返す。',
      mean: 'godforsaken ＝ ひどくて何もない場所。答えを求めない質問で、いやだと言っている。',
      trap: '疑問文なので本当に聞いていると取りやすい。強い形容詞が気持ちを示している。',
      use: 'Why would I want to stay longer?（なんで長居したいと思うの）' },

    // R fix: "slowly, one stop a day" was a filler (V2); now "a rough guide", what "follow that itinerary" means
    //   without the idiom.
    // why: her letter ← "letter" read as 手紙 (and letters come later in the clip); rough guide ← only "follow that
    //   itinerary" caught, "to the letter" lost
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'letter', seg: [12.8, 20.1],
      stem: 'What does Leslie ask Ron to do with the itinerary?',
      choices: ['Follow it exactly as written', 'Follow the letter she wrote with it', 'Use it only as a rough guide'],
      a: 0,
      cue: '「If you follow that itinerary」のあとの3語。',
      line: 'If you follow that itinerary *to the letter*, I promise you, you will not be disappointed.',
      said: '「日程表をきっちり守れば、がっかりさせない」と約束する。',
      mean: 'to the letter ＝ 一字一句そのとおりに。指示を正確に守ること。',
      trap: 'letter を手紙と取りやすい。follow ... to the letter で一つの言い方。',
      use: 'Follow the recipe to the letter.（レシピどおりに正確に作って）' },

    // why: will ← the weak "would" heard as a plan; wouldn't ← the -n't guessed from the grumpy tone; could ← the d heard,
    //   the vowel lost
    { id: 's1', skill: 'sound', level: 'B2', point: 'offer', seg: [19.7, 23.6],
      stem: 'Fill the gap: “Well, I ___ offer to buy you a drink…”',
      choices: ['would', 'will', 'wouldn’t', 'could'], a: 0,
      cue: '「Well, I」のあと、弱く短い語。',
      line: 'Well, I *would* offer to buy you a drink, but…',
      said: '「一杯おごりたいところだが…」と言いかけ、but で続ける。',
      mean: 'would は「本当なら〜する」の仮の話。あとに but が来て、できない理由が続く。',
      trap: 'would は弱く「ウッ」くらい。will だと but と合わない。前置きの形と覚える。',
      use: 'I would help, but I’m busy.（手伝いたいけど、忙しくて）' },

    // why: turning it down ← "but" + grumbling read as a refusal; asking for a pub ← "where…?" taken as a real question
    { id: 'pr1', skill: 'pragma', level: 'C1', point: 'drink', reveals: ['offer'], seg: [19.7, 25.2],
      stem: 'What is Ron doing with his line about buying Leslie a drink?',
      choices: ['Thanking her, with a dig at Europe', 'Turning down her gift, but politely',
                'Asking her to find a pub for them'], a: 0,
      cue: 'but のあとの「where」は本当の質問か。',
      line: 'Well, I would offer to buy you a drink, but *where the hell would that even happen*?',
      said: '「一杯おごりたいが、そんな場所がどこにある？」と言い、レスリーは「ここはロンドンよ」と返す。',
      mean: 'お礼の気持ちを示しつつ、ヨーロッパへの文句を混ぜている。',
      trap: 'where を本当の質問と取りやすい。答えを求めない、文句の言い方。',
      use: 'Where would I even find one?（そもそもどこにあるんだよ）' },

    // R fix: "between" in the stem gave away two (V2/S1); the stem now names the moment only.
    // why: one ← only "a pub" heard, not the shops; three ← "there's a pub" said three times
    { id: 'n1', skill: 'number', level: 'B1', point: 'shops', seg: [24.0, 29.4],
      stem: 'When Leslie points out pubs, how many butcher shops does she mention?',
      choices: ['One', 'Two', 'Three'], a: 1, keep: true,
      cue: '「between those」のあと。',
      line: 'there’s a pub *between those two* butcher shops.',
      said: '「あそこにもパブ、あそこにも、あの肉屋とその隣の肉屋の間にも」と指さす。',
      mean: 'ロンドンにはパブがいくらでもある、と言い返している。',
      trap: 'there’s a pub が3回続くので3と取りやすい。数は between のあとに来る。',
      use: 'It’s between the bank and the café.（銀行とカフェの間だよ）' },

    // R fix: "mistakes the butcher shops for pubs" was absurd (K3); now "pleased with London's pubs", the literal read of
    //   "Let's go to that one".
    // why: farthest ← he picks a different pub, read as being difficult; pleased ← "Let's go to that one" read as
    //   eagerness, the "but… first" missed
    { id: 'h1', skill: 'humor', level: 'C1', point: 'butcher', reveals: ['shops'], seg: [24.0, 34.0],
      stem: 'What makes Ron’s choice of pub funny?',
      choices: ['The meat shops excite him more than the pub', 'He picks the farthest pub just to annoy her',
                'He finally sounds keen on London’s pubs'], a: 0,
      cue: '店を選んだあと、but のあとの予定。',
      line: 'Let’s go to that one, but… in *those two butcher shops first*.',
      said: 'パブの話なのに「あれにしよう。ただし先にあの肉屋2軒に寄る」と言う。',
      mean: 'ロンドンで初めてやる気を見せたのが肉屋。肉好きの彼らしいオチ。',
      trap: '別のパブを選んだので意地悪と取りやすい。but のあとが本当の楽しみ。',
      use: 'But first, let’s grab some food.（でも先に何か食べよう）' },

    // why: we'd ← the ll after we is weak and sounds like d; we're ← "be stopping" heard as present -ing
    { id: 's2', skill: 'sound', level: 'B2', point: 'stopping', reveals: ['shops', 'butcher'], seg: [29.2, 33.8],
      stem: 'Fill the gap: “Let’s go to that one, but ___ stopping in those two…”',
      choices: ['we’ll be', 'we’d be', 'we’re'], a: 0,
      cue: '「but」のすぐあと、主語にくっついた音。',
      line: 'Let’s go to that one, but *we’ll be* stopping in those two butcher shops first.',
      said: '「あそこにしよう。ただし先に肉屋2軒に寄ってからだ」。',
      mean: 'we’ll be -ing ＝ 予定として「〜することになる」。決定事項として言っている。',
      trap: 'we’ll の l は弱く、we’d に聞こえやすい。be が続けば will の未来形。',
      use: 'We’ll be stopping for lunch.（途中でお昼に寄ります）' },

    // R fix: "award committee" in the stem made praise obvious, and "don't care, so Leslie needs help" was incoherent
    //   (V2/K3).
    // why: nobody cares ← the opening about apathetic people taken as the point; works too much ← "every waking moment"
    //   read as a worry
    { id: 'g2', skill: 'gist', level: 'B2', point: 'praise', reveals: ['contrast'], seg: [52.0, 106.2],
      stem: 'What is the letter in the voice-over mainly saying?',
      choices: ['Leslie truly cares about making others’ lives better', 'Most people in town no longer care about Leslie',
                'Leslie works far too hard and needs to slow down'], a: 0,
      cue: '最初の暗い話のあと、どこで話が変わるか。',
      said: '無関心な人が多いと始め、レスリーは違う、皆を本気で気にかけると続ける。',
      mean: '推薦の手紙。人の暮らしを良くするのが彼女の生きがいだとまとめる。',
      trap: '最初の無関心な人の話を主題と取りやすい。not one of these people から本題。',
      use: 'She really cares about people.（彼女は本当に人を思いやる）' },

    // R fix: rebalanced (V2): "complain about the town" and "help the town" are now a warning and a nobody-helps-her
    //   complaint, both built from "don't care".
    // why: warn ← "not one of these people" heard as "not yet"; nobody helps ← "don't care at all" taken as about her
    { id: 'i3', skill: 'infer', level: 'B2', point: 'contrast', seg: [52.0, 67.0],
      stem: 'Why does the letter open by describing people in the writer’s town?',
      choices: ['To set Leslie apart from people like that', 'To warn that Leslie could become like them',
                'To complain that nobody there helps Leslie'], a: 0,
      cue: '暗い話のあと、Leslie Knope の名前が出る一文。',
      line: 'there are a lot of *apathetic* people… Leslie Knope is *not one of these people*.',
      said: '「私の町には無関心な人が多い。レスリー・ノープはその一人ではない」。',
      mean: '先に反対の例を出し、彼女の良さを目立たせる書き方。',
      trap: '最初だけ聞くと町の悪口に聞こえる。not one of these のあとが言いたいこと。',
      use: 'Unlike most people, she listens.（大半の人と違って、彼女は聞いてくれる）' },

    // R fix: "apathetic" in the stem gave the key away, and "rush through life" was a filler (V2/S1); C is now the
    //   other "watch" reading.
    // why: look after them ← captions' "watch over them" (to protect); watch closely ← "watch" heard, "over" read as
    //   looking on
    // retired: the ear-check policy: the key rests on “wash” (whisper “wash over them”, captions “watch over them”,
    //   61.0 s); back after the ear check
    { id: 'p2', skill: 'phrase', level: 'C1', point: 'wash', seg: [57.0, 64.4], retired: true,
      stem: 'How does the letter say these people deal with the world?',
      choices: ['They let life pass without taking part', 'They let others look after them in life',
                'They watch the world closely, but say nothing'], a: 0,
      cue: '「They let the world」のあとの動詞と over。',
      line: 'They let the world *wash over them*, and barely notice anyone else is even there.',
      said: '「世の中が上を流れていくに任せ、周りの人にもほとんど気づかない」。',
      mean: 'wash over ＝ 波のように過ぎる。何にも関わらない、というたとえ。',
      trap: 'watch over（見守る）と聞こえやすい。後ろの barely notice と合う方を。',
      use: 'Just let it wash over you.（気にせず受け流して）' },

    // R fix: "big, costly" and "about her work" were easy to rule out (V2); now two adjective pairs parallel to the key.
    // why: personal ← "come to her" heard as private problems; serious ← "problems" + a town job read as hard ones
    { id: 'd3', skill: 'detail', level: 'B1', point: 'petty', seg: [71.0, 80.0],
      stem: 'What kind of problems do people bring to Leslie?',
      choices: ['Trivial, silly ones', 'Odd, personal ones', 'Hard, serious ones'], a: 0,
      cue: '「with the」のあと、-est で終わる2語。',
      line: 'People come to her with the *pettiest, stupidest* problems',
      said: '「みんなとてもささいで、くだらない問題を持ち込む」。',
      mean: 'それでも彼女は本気で気にかける、と次につなげる前置き。',
      trap: 'petty は聞き慣れない語。すぐ後の stupidest と同じ方向の意味だと考える。',
      use: 'Sorry, it’s a petty question.（ささいな質問ですみません）' },

    // R fix: "compares her to someone else" had no one to compare with (K3); now like = "for example", a real reading.
    // why: example ← like read as for example; unsure ← like read as a vague filler that softens the claim
    { id: 'm1', skill: 'marker', level: 'B2', point: 'like', reveals: ['petty'], seg: [75.4, 80.0],
      stem: 'After “she cares”, what does the next short word do?',
      choices: ['It sets up a stronger version of the claim', 'It brings in an example of her caring',
                'It makes the claim sound less certain'], a: 0,
      cue: '「she cares」が2回。その間の一語。',
      line: 'and she cares, *like really actually* cares, what happens to them.',
      said: '「彼女は気にかける。いや、本当に、心から気にかける」。',
      mean: 'この like は「つまり、もっと言うと」。言い直して強める合図。',
      trap: 'like を「たとえば」と取ると例が続くと思う。後ろは例ではなく��強い言い直し。',
      use: 'It was good, like really good.（よかった。いや、本当によかった）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'better', seg: [80.0, 85.2],
      stem: 'Type what you hear: “your life ___ every day.” (2 words)', answer: 'gets better',
      cue: '「her friend」のあと。2語目の t は弾む音。',
      line: 'if you’re lucky enough to be her friend, your life *gets better* every day.',
      said: '「彼女の友だちになれた人は、毎日暮らしが良くなっていく」。',
      mean: 'gets better ＝ 前より良くなる。get が「変化」を表す。',
      trap: 'better の t は「ラ」に近く、gets と続くと「ゲッツベラー」。一語ずつ切って書く。',
      use: 'It gets better every day.（日に日に良くなってる）' },

    // R fix: "the writer's own secret dream job" was a filler (V2); now a keyword trap on "astronaut".
    // why: mocks Leslie ← the silly example read as aimed at her; her old dream ← "astronaut" + "her true purpose"
    //   heard together
    { id: 'h3', skill: 'humor', level: 'C1', point: 'hotdog', seg: [89.8, 98.4],
      stem: 'What makes the line about other people’s purposes funny?',
      choices: ['It puts a silly goal right beside a grand one', 'It hints that Leslie’s purpose is just as silly',
                'It says Leslie once dreamed of space'], a: 0,
      cue: '「For some people」のあと、二つの例。',
      line: 'For some people, I guess that’s being an *astronaut* or a *hot dog eating champion*.',
      said: '「人によっては、それは宇宙飛行士だったり、ホットドッグ早食い王だったりする」。',
      mean: '立派な夢とばかばかしい夢を、同じまじめさで並べるところが笑い。',
      trap: 'ばかにしているのはレスリーではない。直後に彼女の本当の目標が語られる。',
      use: 'For some people, that’s golf.（人によっては、それがゴルフだったりね）' },

    // R fix: "Polite" made the key the only sincere-and-nuanced choice (K6); now "grudging", a closer stance.
    // why: sarcastic ← "terribleness" carries over to the whole line; grudging ← praising a place to please Leslie
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'surprise', reveals: ['muchto'], seg: [106.5, 118.6],
      stem: 'How does Ron sound about finding a place he likes?',
      choices: ['Honestly surprised to be impressed', 'Sarcastic, still mocking Europe here',
                'Grudging, saying it to please Leslie'], a: 0,
      cue: '「But it turns out」から、声と言葉の変化。',
      line: 'But it turns out, *much to my surprise*, there is actually one place in Europe that is *worth seeing*.',
      said: '「ヨーロッパは避けてきたが、意外にも見る価値のある所が一つあった」。',
      mean: 'much to my surprise と actually で、本当に意外だと認めている。',
      trap: '直前の terribleness で皮肉と取りやすい。But から反対の話。',
      use: 'Much to my surprise, I loved it.（意外にも、すごく気に入った）' },

    { id: 'x2', skill: 'dict', level: 'B2', point: 'muchto', reveals: ['surprise'], seg: [112.4, 118.6],
      stem: 'Type what you hear: “But it turns out, ___, there is…” (4 words)',
      answer: 'much to my surprise',
      cue: '「turns out」のあと、4語のまとまり。',
      line: 'But it turns out, *much to my surprise*, there is actually one place in Europe',
      said: '「でも分かったことに、驚いたことに、ヨーロッパにも一つだけ…」。',
      mean: 'much to my surprise ＝ とても意外なことに。文の途中に入れて驚きを足す。',
      trap: 'to と my はとても弱く「マッチュマイ」とつながる。4語あると思って書く。',
      use: 'Much to my surprise, the train was early.（意外にも列車が早く来た）' },

    // R fix: "strong" cued the key and "fresh water" was weak (V2/K6); all three are now aged drinks, told apart only
    //   by "distilled".
    // why: beer ← "barreled" + "prepared for consumption" fit beer; wine ← "God's chosen" read as monks, "barreled"
    //   fits wine, "distilled" is missed
    { id: 'i2', skill: 'infer', level: 'C1', point: 'elixirs', seg: [118.8, 131.0],
      stem: 'What is Ron describing as “God’s chosen elixirs”?',
      choices: ['A spirit made and aged on the islands', 'A beer brewed and aged on the islands',
                'A wine made and aged by island monks'], a: 0,
      cue: 'elixirs のあとの三つの動詞。',
      line: 'where God’s chosen elixirs are *distilled, barreled, and prepared for consumption*.',
      said: '「神に選ばれた飲み物が蒸留され、たるに詰められ、飲める形になる所」。',
      mean: 'distilled ＝ 蒸留した。たるで寝かせる強いお酒を大げさに言っている。',
      trap: 'barreled ならビールもワインも合うが、distilled（蒸留）はどちらにも使わない。',
      use: 'This is worth the trip alone.（これだけで来た価値がある）' },

    // R fix: "read quietly" was a filler (V2); now her own poem, from “Love, Leslie” at the end of the note.
    // why: her poem ← the note is signed "Love, Leslie", "by… Robert Burns" lost; write ← "the poem by…" heard as his
    //   own poem about the view
    { id: 'd4', skill: 'detail', level: 'B1', point: 'aloud', seg: [132.5, 147.0],
      stem: 'At the cliffs, what does Leslie’s note ask Ron to do?',
      choices: ['Read a poem out loud', 'Read a poem she wrote', 'Write a poem of his own'], a: 0,
      cue: '「please read」のあとの2語。',
      line: 'please *read out loud* the poem by the great Scotsman Robert Burns.',
      said: '「海をながめながら、詩人バーンズの詩を声に出して読んで」と手紙にある。',
      mean: 'read out loud ＝ 声に出して読む。read だけなら黙読でもいい。',
      trap: '最後の Love, Leslie で彼女の詩と思いやすい。by のあとの名前が作者。',
      use: 'Could you read it out loud?（声に出して読んでくれる？）' },

    // R fix: "with care" claimed a tone the words don't carry (V1); the key now rests on the reading heard to its end.
    // why: never read it ← "what she thought I'd get" read as not trying; blames the poet ← the poem is by Burns, not her
    { id: 'h2', skill: 'humor', level: 'C1', point: 'getout', reveals: ['aloud'], seg: [170.0, 182.6],
      stem: 'What makes Ron’s comment after the reading funny?',
      choices: ['He reads it right to the end, then shrugs it off', 'He admits he never really read the poem at all',
                'He blames the poet, not Leslie, for wasting time'], a: 0,
      cue: '詩の朗読が終わったあとの、短い一言。',
      line: 'I don’t know what she thought I’d *get out of that*.',
      said: '詩を最後まで読んだあと「彼女は俺がこれで何を得ると思ったんだか」と言う。',
      mean: 'get out of ＝ 〜から得る。丁寧に読んだのに、感想はそっけない。その落差が笑い。',
      trap: '主語は she。詩人ではなく、レスリーの考えについて言っている。',
      use: 'What did you get out of it?（それで何を得たの）' },
  ]
};
