// REVIEW 2026-11-16: pass 6, fix 18, drop 0, new 0; ear checks 3
// REVIEW Q: n1 (three kids) can be answered from show knowledge alone. Kept, because nothing in the item cues it.
// “Leslie refuses Ron's generous offer | Parks and Recreation” (the official Parks and Recreation channel, Season 7):
// Leslie calls her old team together against Ron, but Tom and Donna have both signed on with him; Terry explains his
// new name; Tom's gala speech turns out to be about Tom; Leslie and Ron fight over the team and a candle; and the cake
// runs out.
// Segments from the captions, words from whisper (2026-11-16). Left out: the realty firm's name and "broker the deal"
// (captions "regalmigo realty… broke up the deal"), "Shia LaBeouf design wedding dresses do not come treat" at 31 s
// (both garbled), the streaking plan at 205–216 s (nudity, "my wiener"), "Morningstar"/"Voldemort or Ron" at 222–231 s
// (backstory and world knowledge), and the candle grab at 236–241 s (captions "I steal your kids", whisper "your
// candle"). Tom names himself, Donna, Ron, Terry and Ben are named in the audio, and Leslie is "Les" at 51.6 s and
// "Leslie" in the closing lines; the stink-bomb pair are never named, so their stems don't name them.
// EAR CHECK: 128.7 s s1 — “They can wrap shrimp”: a weak “can” (クン), not “can't” (both sources have “can”)
// EAR CHECK: 188.2 s s2 — “turn ’em back on” (whisper “’em”, captions “them”): the reduced form sounds like a weak “him”
// EAR CHECK: 199.3 s x1 — “got rid of” runs together (ガリダヴ); both sources agree on the words
import type { Clip } from '../types.ts';

export const ronsTeam: Clip = {
  id: 'ronsteam', video: 'bTfXhroy2CQ', title: 'Leslie refuses Ron\'s generous offer', dur: 283, wpm: 160,
  band: 'mid', tags: ['友だち', '職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %): the key was the only choice naming Ron, and the title says they're at odds. "win Ron over"
    //   now carries Ron too, and the city-project filler is gone.
    // why: farewell ← "we don't see each other as much" + "one last" heard as a goodbye; win Ron over ← "Ron" + the
    //   team chant heard without "defeat", the title's "generous offer" suggesting a deal
    { id: 'g1', skill: 'gist', level: 'B1', point: 'mission', reveals: ['three'], seg: [0, 15.2],
      stem: 'What does Leslie want from her old team tonight?',
      choices: ['Their help to beat Ron one more time', 'A last get-together before they drift apart',
                'Their help to win Ron over one more time'], a: 0,
      cue: '「one last mission」のあと、手を重ねる掛け声。',
      line: 'I need my old team back for *one last mission*. So, hands in, *defeat Ron* on three.',
      said: '昔のチームに「最後の任務」として集まってほしいと言い、「ロンを倒すぞ」と手を重ねる。',
      mean: 'mission は遊び心のある言い方。中身は、ロンに対抗するための協力の頼み。',
      trap: '「最近会えない」「最後の」から別れの会に聞こえやすい。掛け声に目的が出る。',
      use: 'I need your help one last time.（最後にもう一度だけ力を貸して）' },

    // R fix: V2 (blind 60 %): the key was the only choice with a restaurant of Tom's own. All three are now food offers.
    // why: campus kitchen ← "restaurant on the new campus" heard as a job running food there; fund it ← "promised" +
    //   "restaurant" heard as money for a place he already has, "build" missed
    { id: 'd1', skill: 'detail', level: 'B1', point: 'restaurant', seg: [12.4, 23.2],
      stem: 'Why is Tom on Ron’s side?',
      choices: ['Ron promised him a restaurant on the new campus', 'Ron offered him a job running the campus kitchen',
                'Ron promised to put money into his restaurant'], a: 0,
      cue: '「actually」のあと、ロンが約束したこと。',
      line: 'Ron promised me *I could build a restaurant* on the new Grizzle campus',
      said: 'ロンが、新しいキャンパスに自分のレストランを建てさせてくれると約束した、と言う。',
      mean: 'だからロンの味方。昔の仲間より、自分の店が先。',
      trap: 'campus から「仕事をもらった」と取りやすい。promised のあとの build を聞く。',
      use: 'He promised me I could stay late.（遅くまでいていいと約束してくれた）' },

    // R fix: V2 (blind 60 %) + K6: the key was the only two-sided, nuanced choice. Two choices now say "Fully sure".
    // why: half sure ← "kind of" taken at face value as a real hedge (〜かも); rubbing it in ← "totally" heard alone,
    //   with the awkward "Oh, actually… kind of" missed
    { id: 'm1', skill: 'marker', level: 'C1', point: 'kindof', seg: [15.6, 23.2],
      stem: 'How sure is Tom about being on Ron’s side?',
      choices: ['Fully sure, though he eases into it', 'Fully sure, and happy to rub it in',
                'Half sure, and still making up his mind'], a: 0,
      cue: '「so I’m」のあと、並んだ二つの語。',
      line: 'so I’m *kind of totally* on Ron’s side.',
      said: '「だから、まあ、完全にロン側」と言う。',
      mean: 'kind of で言いにくさを和らげ、すぐ totally で本音を出す。気まずい知らせの言い方。',
      trap: 'kind of だけ拾うと「迷っている」に聞こえる。あとに来る強い語の方が本音。',
      use: 'I’m kind of totally lost right now.（正直、完全に迷子です）' },

    // R fix: V2 (blind 65 %): the key was the only choice that was joking. All three are now jokes.
    // why: doomed ← "dead" read as "finished" (失敗する), about the plan he just named; Ron drops him ← "dead" heard as
    //   a warning about trusting Ron
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'dead', seg: [17.0, 23.2],
      stem: 'After Tom picks Ron, what does Leslie mean about Tom?',
      choices: ['She’s jokingly cutting him off as a friend', 'She’s joking that his restaurant plan is doomed',
                'She’s joking that Ron will drop him soon'], a: 0,
      cue: '「Okay」のあとの短い一言と、すぐ次の呼びかけ。',
      line: 'Okay, *Tom’s dead to me*. Donna…',
      said: '「はい、トムとは縁を切った。ドナ、手を待ってる」と言う。',
      mean: 'X is dead to me ＝ もう縁を切った、という大げさな決まり文句。ここでは冗談。',
      trap: 'dead を「計画がだめになる」と取りやすい。to me が付くと「私にとっては」の話。',
      use: 'Pineapple pizza is dead to me.（パイナップルのピザとは縁を切った）' },

    // why: a shop like Tom ← Tom's reason, just heard, carried over to Donna; plan the wedding ← "wedding" is said, in
    //   the wrong relation
    { id: 'd2', skill: 'detail', level: 'B2', point: 'donna', seg: [23.0, 32.8],
      stem: 'Why does Donna side with Ron too?',
      choices: ['Her firm gets paid on his deal, and she needs it', 'Ron promised her a shop on the new campus, like Tom',
                'Ron offered to help plan her wedding for free'], a: 0,
      cue: '「Yeah」のあと、ロンが雇った相手と、お金の使い道。',
      line: 'Ron *hired* … *Realty* … and I’m gonna *need the money for my wedding*.',
      said: 'ロンが自分の不動産会社に取引を任せた、結婚式にお金が要る、と言う。',
      mean: '自分の会社がロンの仕事で稼ぐので、ロン側。理由はお金と結婚式。',
      trap: '直前のトムの「店を建てる」に引かれやすい。人ごとに理由が違うので、毎回聞き直す。',
      use: 'I’m gonna need the money for rent.（家賃にそのお金が要るんだ）' },

    // R fix: V2 (blind 50 %): "worried it's so sudden" was weak. It's now "saw it online first", from “Grizzle Feed”.
    // why: online first ← "didn't post anything on Grizzle Feed" half caught, the "didn't" lost; Ron's side ← the hurt
    //   over Tom carried into this reply
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'furious', seg: [32.7, 46.0],
      stem: 'How does Leslie take Donna’s big news?',
      choices: ['Delighted, but upset she wasn’t told sooner', 'Delighted, but upset she saw it online first',
                'Delighted, but hurt Donna chose Ron’s side'], a: 0,
      cue: '「amazing」のあと、how could you が指すこと。',
      line: 'you’re getting married? That’s amazing! … you *didn’t tell me earlier*, how could you? … I’m *furious*…',
      said: '「結婚？すごい！なんで早く言ってくれないの」と喜び、「すてき、そして怒ってる」と言う。',
      mean: '大喜びと、知らされるのが遅かった不満が同時。怒りは半分冗談の愛情表現。',
      trap: 'ロンの件の怒りと取りやすい。how could you の前の文が、責めている中身。',
      use: 'You got engaged and didn’t tell me?（婚約したのに言ってくれなかったの？）' },

    // why: Joe's request ← Joe is named just before; family first ← a common reason to hold news back (家族が先)
    { id: 'd3', skill: 'detail', level: 'B1', point: 'person', seg: [37.6, 42.3],
      stem: 'Why didn’t Donna share her news online?',
      choices: ['She wanted to tell Leslie face to face', 'Joe asked her to keep it quiet for now',
                'She hadn’t told her own family yet'], a: 0,
      cue: '「Grizzle Feed」のあと、cause に続く理由。',
      line: 'I didn’t post anything… ’cause I wanted to tell you *in person*.',
      said: 'SNSに何も載せなかったのは、直接伝えたかったから、と言う。',
      mean: 'in person ＝ 会って、直接。大事な知らせはまず友だちに、という気持ち。',
      trap: '直前の Joe の名前に引かれやすい。cause（because）のあとが理由。',
      use: 'I wanted to thank you in person.（直接お礼を言いたくて）' },

    // R pass, note: a fan of the show knows Leslie has three kids, but nothing in the item gives it away.
    // why: two ← "trying to destroy us" holds a "to"/"two" sound just before; four ← "there's" + a short number heard
    //   at speed, the th dropped
    { id: 'n1', skill: 'number', level: 'B1', point: 'three', reveals: ['em'], seg: [46.0, 51.45], keep: true,
      stem: 'How many kids does Leslie say she has?',
      choices: ['Two', 'Three', 'Four'], a: 1,
      cue: '「destroy us」のあと、There’s に続く数。',
      line: 'They’re great. No, they’re trying to destroy us. There’s *three* of them.',
      said: '「元気。いや、壊されそう。3人いるの」と言う。',
      mean: 'there’s three of them ＝ 3人いる。会話では複数でも there’s がよく使われる。',
      trap: 'there’s は単数形なので少なく感じやすいが、会話では数に関係なく使う。',
      use: 'There’s three of us tonight.（今夜は3人です）' },

    // R fix: V2 (blind 55 %): the key was the only "X, but Y" choice. All three are two-part now.
    // why: sorry ← "destroy us" and "insane" taken literally as regret; full of energy ← "they're great" taken alone,
    //   the correction after it missed
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'kids', seg: [46.0, 51.45],
      stem: 'Asked about her kids, how does Leslie really feel?',
      choices: ['Worn out by them, but happy all the same', 'Happy with them, but sorry she had so many',
                'Thrilled with them, and full of energy herself'], a: 0,
      cue: '最初の答えのあとの「No」と、最後の but。',
      line: 'They’re great. No, they’re *trying to destroy us*. … It’s *insane*, but they’re great.',
      said: '「元気」から「いや、壊されそう、めちゃくちゃ」と言い直し、「でも最高」で終える。',
      mean: '子育ての大変さを大げさに言いつつ、最後に愛情を戻す。親がよく使う言い方。',
      trap: 'destroy や insane を文字通り取ると後悔に聞こえる。but のあとが結論。',
      use: 'It’s crazy, but I love it.（大変だけど、楽しいよ）' },

    // R fix: V2 (blind 50 %): the key was the only choice with a joke in it. The excuse choice is now light too.
    // why: feel bad ← the apology form taken at face value (sorry = 謝罪); an excuse ← "We gotta run" and "Later" sit
    //   right around it
    { id: 'pr1', skill: 'pragma', level: 'C1', point: 'crush', seg: [51.2, 56.9],
      stem: 'As Tom and Donna leave, what is the “sorry” doing?',
      choices: ['Gloating about their win, just as a joke', 'Admitting they feel bad about beating her',
                'Excusing their early exit, with a laugh'], a: 0,
      cue: 'sorry のあと、何について謝っているか。',
      line: 'We gotta run, Les. Sorry for *totally crushing it*, and *you in the process*. Later.',
      said: '「もう行くね。大成功して、ついでにあなたを負かしてごめん」と言う。',
      mean: 'crush it ＝ 大成功する。謝る形を借りた勝ちの自慢で、からかい半分。',
      trap: 'Sorry を聞くと本気の謝罪と取りやすい。何について謝るかを聞けば、自慢だと分かる。',
      use: 'Sorry for being so good at this.（上手すぎてごめんね）' },

    // R fix: V2 (blind 60 %): "mixed up with his boss" was weak. It's now "careful to get names right", because
    //   "already named Larry, so…" sounds like care if the "Gary… Who cares?" part is missed.
    // why: like him ← a nickname at work read as warmth, plus "a fun group" at the end; get names right ← the Larry
    //   clash heard as them avoiding a mix-up, the real name and "Who cares?" missed
    { id: 'i1', skill: 'infer', level: 'B2', point: 'cares', seg: [60.9, 74.6],
      stem: 'What does Terry’s name story show about his coworkers?',
      choices: ['They don’t really care what he’s called', 'They gave him a nickname because they like him',
                'They take care to get everyone’s name right'], a: 0,
      cue: '本名を言ったときの、相手の返事。',
      line: 'I said my real name is *Gary*, and they said, “*Who cares?*” So, it’s just a fun group.',
      said: '本名はゲーリーと言うと「どうでもいい」と返された、と話す。',
      mean: '名前すら気にされない扱い。fun group は、それをごまかす一言。',
      trap: '最後の fun group だけだと仲が良さそう。返事の Who cares? で扱いが分かる。',
      use: 'Who cares? It’s just a game.（どうでもいいよ、ただのゲームだし）' },

    // R fix: V2 (blind 65 %) + K6: "In Tom’s speech" plus "Tom, the speaker himself" pointed at the twist. The stem no
    //   longer names the speaker, and every choice is a name with a role.
    // why: Ben ← the honoree he announces at the end of the speech; founder ← a bicentennial speech about the town's
    //   past, "one great man came along"
    { id: 'd4', skill: 'detail', level: 'B1', point: 'me', seg: [91.0, 105.4],
      stem: 'In the gala speech, who is the “one great man” who lifted the town?',
      choices: ['Tom, the restaurant owner', 'Ben, the man of the year', 'The man who founded the town'], a: 0,
      cue: '長い間のあと、that man was に続く語。',
      line: 'one great man came along… And *that man was me*, Tom Haverford',
      said: '「ある偉大な男が現れ、皆を引き上げた」と語り、間を置いて「その男とは私、トム」と言う。',
      mean: '町の歴史の話のふりをして、自分の宣伝。間を置いたぶん落ちが効く。',
      trap: '記念の式典なので、町を作った人や今夜の主役を思い浮かべやすい。間のあとの一語を聞く。',
      use: 'And that person was me.（そして、それが私でした）' },

    // R fix: V2 (blind 60 %): the key was the only choice describing a mismatch. All three now say how he hears her
    //   question.
    // why: Tom and Donna ← what "how could you" really means, with his shrimp answer missed; attack on his company ←
    //   the fight over the team carried into this turn, and the shrimp answer missed
    { id: 'h1', skill: 'humor', level: 'C1', point: 'skewer', seg: [113.3, 119.65],
      stem: 'Why does Ron’s answer to “how could you?” get a laugh?',
      choices: ['He hears it as a question about cooking', 'He hears it as a question about Tom and Donna',
                'He hears it as an attack on his company'], a: 0,
      cue: '責める質問と、Ron の答えの中身のずれ。',
      line: 'Ron, how could you? — I simply *took a skewer for one shrimp* and *added many shrimp* to it.',
      said: '「どうして」と責められ「1匹用の串にエビを何匹も刺しただけ」と答える。',
      mean: '責める how could you を、作り方の質問として受け流す。ずらした答えが笑い所。',
      trap: 'how を「どうやって」と取ると答えが合って見えるが、問いの本題はチームの件。',
      use: 'How could you eat my sandwich?（なんで私のサンド食べたの？）' },

    // R fix: V2 (blind 70 %): the key was the only choice about the team. "He has walked away from their old team" is
    //   now a second team reading.
    // why: the park ← "steal my park" is said, but as the earlier wrong ("tried"), not tonight's; walked away ← "team"
    //   + Ron's "moved on… just like you did" heard as a charge against him
    { id: 'g2', skill: 'gist', level: 'B2', point: 'team', seg: [113.4, 138.0],
      stem: 'What is Leslie’s main complaint against Ron at the party?',
      choices: ['He has taken her old team over to his side', 'He has taken her park away for his company',
                'He has walked away from their old team'], a: 0,
      cue: '「First you tried…」のあと、and now に続く文。',
      line: 'First you tried to steal my park, and *now you steal my team*.',
      said: 'ロンに「前は公園を奪おうとし、今度はチームを奪う」と責める。',
      mean: '今夜の不満はチームの件。公園は前の話で、first と now で順番を示している。',
      trap: 'park も steal も聞こえるので迷いやすい。first は前のこと、now が今のこと。',
      use: 'First you’re late, and now this?（遅刻の次はこれ？）' },

    // R fix: V2 (blind 55 %): the key was the only choice about leaving. All three now have the "X too, so…" shape.
    // why: took people ← her own "steal" turned back on her ("you, too"); join him ← "moved on to better things" heard
    //   as his side being the better thing, for her as well
    { id: 'i2', skill: 'infer', level: 'C1', point: 'movedon', seg: [119.6, 128.5],
      stem: 'What is Ron hinting about Leslie herself?',
      choices: ['She moved on too, so she can’t blame them', 'She took people too, so she can’t blame him',
                'She should move on to his side, as they did'], a: 0,
      cue: '最後の「just like」のあと。',
      line: 'They’re independent people who have *moved on* to better things, *just like you did*.',
      said: '「彼らは自立した大人で、いい道に進んだ。君と同じく」と返す。',
      mean: 'just like you did ＝ 君も昔の場所を離れた、という切り返し。',
      trap: 'steal の流れから「君も奪った」と聞きやすい。did が指すのは直前の moved on。',
      use: 'People move on, just like you did.（人は前に進むよ、君みたいに）' },

    // why: can't ← can and can't sound alike once the t drops; could ← a past-tense reading after "have moved on"
    { id: 's1', skill: 'sound', level: 'B2', point: 'can', seg: [128.3, 133.2],
      stem: 'Fill the gap: “They ___ wrap shrimp.”',
      choices: ['can', 'can’t', 'could'], a: 0,
      cue: 'They のすぐあと、短い一音の長さと強さ。',
      line: 'They *can* wrap shrimp. If it’s seven on this one, it’s a masterpiece.',
      said: '「彼らはエビを串に巻ける。この1本に7匹なら傑作だ」と言う。',
      mean: '肯定の can は弱く「クン」に近く、動詞の wrap が強い。新しい仲間の腕をほめている。',
      trap: 'can’t は t が消えても母音が長く強い。can は弱く短い。強弱で聞き分ける。',
      use: 'I can make it by six.（6時までに行けます）' },

    // R fix: V2 (blind 75 %): "a real skewer" was absurd. It's now "talking about her", from “behind someone's back”.
    // why: talking about her ← "stab… in the back" mixed up with "talk behind her back" (陰口); the food ← "shove them
    //   all in your dumb mouth" heard as a complaint about him eating
    { id: 'ph3', skill: 'phrase', level: 'B2', point: 'stab', reveals: ['can'], seg: [133.1, 137.4],
      stem: 'What is Leslie accusing Ron of with her skewer remark?',
      choices: ['Betraying her as soon as she looks away', 'Talking about her as soon as she looks away',
                'Keeping all the good food to himself'], a: 0,
      cue: '「when I turn around」のあと。',
      line: 'when I turn around, you can *stab me in the back* with the skewer.',
      said: '「私が振り向いたら、その串で背中を刺せば」と言う。',
      mean: 'stab someone in the back ＝ 裏切る。怒りを串に引っかけて言う。',
      trap: 'behind my back（陰で）と混ざりやすい。in the back が付くと裏切り。',
      use: 'He totally stabbed me in the back.（彼に完全に裏切られた）' },

    // R fix: V2 (blind 75 %): the key was the only choice with a contradiction in it. Both distractors now pair
    //   humility with a boast or an admission.
    // why: hard for him ← "not for me" heard as "humble isn't for me", a confession, and the next line as a boast;
    //   admits he isn't ← "Not for me" heard as "it's not me", an honest aside
    { id: 'h3', skill: 'humor', level: 'C1', point: 'humble', seg: [137.9, 151.0],
      stem: 'Why does Tom’s answer about staying humble get a laugh?',
      choices: ['He boasts about how good he is at being humble', 'He admits humility is hard, then boasts anyway',
                'He claims to be humble, then admits he isn’t'], a: 0,
      cue: '「not for me」のあとの一文。',
      line: 'is it hard to stay humble? And I say, “Not for me. I’m *pretty amazing at being humble*.”',
      said: '「謙虚でいるのは大変？」と聞かれ「僕には簡単。謙虚さなら最高だから」と答える、と話す。',
      mean: '謙虚さを自慢した時点で謙虚ではない。中身と言い方が矛盾していて笑える。',
      trap: 'not for me を「僕向きじゃない」と取ると告白に聞こえる。次の文が中身。',
      use: 'I’m pretty amazing at waiting.（待つのは得意なんだ）' },

    // anchor: 148.5–153.1 s "I'm pretty amazing at being humble. But enough about me.", then 164.6–168.8 s Ben's "thank
    //   you to Tom for that moving tribute to you": the speech Ben thanks him for was Tom's speech about Tom
    // R fix: V2 (blind 60 %): "Nobody" was the odd one out, and the key said "all about himself". Each choice now
    //   names a person.
    // why: the crowd ← "moving" taken as about the audience, with "to you" missed; self-deprecation ← a modest
    //   honoree's joke that he wasn't worth a speech, with the final "to you" missed
    // retired: one C2 alone is under 2 (nt2 retired)
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'me', seg: [148.0, 169.5], retired: true,
      stem: 'In Ben’s thanks for “that moving tribute,” who is the joke on?',
      choices: ['Tom, who praised himself instead of Ben', 'The crowd, who found the tribute so moving',
                'Ben, who says he doesn’t deserve such praise'], a: 0,
      cue: 'お礼の最後の二語が、誰を指すか。',
      line: 'But *enough about me*. … And thank you to Tom for that moving tribute *to you*.',
      said: 'トムは自分の話の末に「僕の話はこのへんで」。ベンは「君への感動的な賛辞をありがとう」と返す。',
      mean: '主役へのはずの賛辞が、トム自身への賛辞だったと to you の一語で指摘する。お礼の形のからかい。',
      trap: 'お礼の言葉は本気と取りやすい。最後の代名詞が誰を指すかで、からかう相手が決まる。',
      use: 'Thanks for that speech about yourself.（ご自分についてのスピーチ、どうも）' },

    // why: him ← the reduced 'em (/əm/) sounds like a weak "him"; it ← "the lights" heard as one thing (the power), and
    //   "it" is short and weak too
    { id: 's2', skill: 'sound', level: 'B2', point: 'em', seg: [185.4, 191.3],
      stem: 'Fill the gap: “We shut off the lights, turn ___ back on.”',
      choices: ['them', 'him', 'it'], a: 0,
      cue: 'turn と back の間の、とても弱い一音。',
      line: 'We shut off the lights, *turn ’em back on*',
      said: '明かりを消してまたつける計画。them が弱まり「エム」に近い。',
      mean: '’em は them の弱い形。turn ’em back on が「ターネムバッコン」に。',
      trap: '弱い ’em は him にも聞こえる。前の複数名詞（lights）を受ける。',
      use: 'Grab your bags and bring ’em in.（荷物を持って中に入れて）' },

    // R fix: V2 (blind 60 %): the key was the only mixed feeling. "Grown up, and proud of it" is now the sincere
    //   flip; "lost interest" is gone.
    // why: afraid of Leslie ← "Leslie's kids" heard as Leslie being the reason; proud ← "responsible adult" heard
    //   without the "sucks" after it
    { id: 'i3', skill: 'infer', level: 'B2', point: 'grown', seg: [194.9, 205.0],
      stem: 'What does the stink-bomb exchange show about the pair now?',
      choices: ['They’ve grown up, and they don’t love it', 'They’ve grown up, and they’re proud of it',
                'They’re afraid of what Leslie will say to them'], a: 0,
      cue: '「I forgot」の理由と、最後のぼやき。',
      line: '…Leslie’s kids. Being a *responsible adult sucks*…',
      said: '子守りの前に臭い玉を処分していたと気づき、「責任ある大人ってほんと最悪」とぼやく。',
      mean: 'いたずら好きのままでも、子どもの世話で大人になった。それが少し悔しい。',
      trap: 'Leslie の名前から「怒られるのが怖い」と取りやすい。処分した理由は子どもの安全。',
      use: 'Being an adult is hard sometimes.（大人って時々つらい）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'gotrid', seg: [198.2, 201.9],
      stem: 'Type the missing words: “I ___ all the stink bombs.” (3 words)', answer: 'got rid of',
      cue: '「I forgot」のすぐあと。三語がつながる。',
      line: 'I *got rid of* all the stink bombs before you…',
      said: '「子守りの前に、臭い玉は全部捨てちゃった」と言う。',
      mean: 'get rid of ＝ 処分する、なくす。got‿rid‿of が「ガリダヴ」のように聞こえる。',
      trap: 'got の t が弾んで「ラ」に近くなり、of はほぼ「ヴ」。三語を一つの音で覚える。',
      use: 'I finally got rid of my old car.（やっと古い車を処分した）' },

    // anchor: 252.2–258.6 s "Who doesn't bake a backup cake?", then the pair: "that seals it. Even Leslie is crazier
    //   than we are": the people laughing name Leslie as the one they're laughing at
    // R fix: V2 (blind 55 %) + K2: the fight may really have spoiled the cake on screen. The Ron choice is now the pair
    //   ("even crazier than she is"), with the comparison heard the wrong way round.
    // why: the staff ← the question's form, a complaint at whoever didn't bake one (right mechanism, wrong target);
    //   the pair ← "Even Leslie is crazier than we are" heard with the comparison flipped
    // retired: for the draws (play 3+ drew no C2 while it was unseen): it shares ph4’s point, and humor is one a draw
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'cake', seg: [246.4, 259.5], retired: true,
      stem: 'In “Who doesn’t bake a backup cake?”, who is the joke on?',
      choices: ['Leslie, who thinks a spare cake is normal', 'The staff, for not planning for trouble',
                'The pair, who are even crazier than she is'], a: 0,
      cue: '直後の二人の感想で、名前が出る人。',
      line: 'Who doesn’t bake a *backup cake*? — Okay, well, that seals it. *Even Leslie is crazier than we are*.',
      said: '予備のケーキがないと知って「予備を焼かない人いる？」。見ていた二人は「レスリーの方がおかしい」。',
      mean: '本人は当然のつもりの文句。予備を焼くのが普通という感覚の方が笑われている。二人の感想が答え合わせ。',
      trap: '疑問形の文句は、責められる誰かに向くと聞きやすい。直後の反応が笑いの的を名指しする。',
      use: 'Who doesn’t pack a spare charger?（予備の充電器を持たない人いる？）' },

    // R fix: V2 (blind 50 %): "wait and see" was weak against "Fully". It's now "Fairly sure; one more sign would settle it".
    // why: fairly sure ← "seals" heard as a step toward a decision, not the last one; keep it quiet ← seal =
    //   封をする, a secret kept between them
    { id: 'ph4', skill: 'phrase', level: 'B2', point: 'cake', seg: [252.0, 259.5],
      stem: 'After the backup-cake line, how sure is the speaker about Leslie?',
      choices: ['Fully sure; that line settles it for them', 'Fairly sure; one more sign would settle it',
                'Sure, but they’ll keep it to themselves'], a: 0,
      cue: '「Okay, well」のあとの短い決まり文句。',
      line: 'Okay, well, *that seals it*. Even Leslie is crazier than we are.',
      said: '「よし、これで決まり。レスリーの方が私たちよりおかしい」と言う。',
      mean: 'that seals it ＝ それで決定だ。迷っていたことに、最後の証拠が出たときの一言。',
      trap: 'seal を「封をする」と取ると「秘密にする」に聞こえる。ここは結論を固める意味。',
      use: 'It’s raining? That seals it, we stay in.（雨？じゃあ決まり、家にいよう）' },
  ]
};
