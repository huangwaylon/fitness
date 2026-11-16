// REVIEW 2026-11-16: pass 4, fix 20, drop 0, new 0; ear checks 2
// OPEN: a cold reader got 23/23 right after the fixes, 18 at ≥ 50 % (a2 65 %; pr1, nt1, nt2, pr3, ph2 60 %); it
//   probably knows the episode, but most keys are still the only coherent story. Your call on how strict V2 is here.
// OPEN: nt3's anchor (101–112 s, "I'm in hell… when I tell her what I did") lies outside its segment, as native-level
//   §2 allows ("the clip later names"), against rubric S4.
// “Ross Tries (and Fails) to Hide His One-Night Stand from Rachel | Friends” (the official Friends channel, Best of
// Season 3): Rachel's message says she wants Ross back; he hurries Chloe out, his friends talk him out of telling
// Rachel, and he follows the chain of people the news could travel along, one step too late.
// Segments from the captions, words from whisper (2026-11-16). Whisper's timings run on a 2 s grid and drift by up to
// 8 s; every segment is from the captions. Untested: 2.8 s ("Morning"), 31.3 s and 38.9 s (Ross answering the
// recorded message: told only by voice), 79–100 s (Rachel arrives; the sources disagree: "Break a leg"/"Rachel!",
// "You got to be kidding me"/"you got my message, Mom?"), 189.6 s ("I did it"), 202.6 s ("You said of course you
// do"/"Did you say of course you do?"), 210 s ("You dog": innuendo), 224–229 s ("Monogamy is too cruel a rule"),
// 286 s ("copy place" in whisper, "coffee place" in the captions).
// EAR CHECK: 159.5 s s1 — "Did you" run together (≈"didja"); both sources say "Did you think about the trail?"
// EAR CHECK: 217.6 s x1 — "happen to have", with a weak "to"; both sources agree. The segment starts at 217.3 s, just
//   after "But, Isaac": confirm it doesn't clip "see"
import type { Clip } from '../types.ts';

export const rossHidesIt: Clip = {
  id: 'rosshides', video: 'g0wb4jPpl3s', title: 'Ross Tries (and Fails) to Hide His One-Night Stand from Rachel',
  dur: 311, wpm: 153, band: 'mid',
  tags: ['恋愛', '友だち'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 60 %): "all his fault" was a filler; now Mark, said but denied. Key reworded off the line
    // R fix: S4: the segment was 15.6 s; it now starts just before "I feel awful"
    // why: angry ← "I've been trying to reach you all night" heard as a complaint; ashamed about Mark ← Mark's name
    //   is said, but in "there's nothing between me and Mark"
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'sorry', seg: [11.9, 25.1],
      stem: 'In her message, how does Rachel feel about their breakup?',
      choices: ['Bad about what she put him through', 'Angry he hasn’t called her back', 'Ashamed of what happened with Mark'],
      a: 0,
      cue: '最初の気持ちの言葉と、最後の文。',
      line: 'I feel awful. … I’m just *so sorry I put you through it*.',
      said: '「マークとは何もない。別れ話なんてばかみたい。つらい思いをさせてごめん」と謝る。',
      mean: 'put you through it ＝ つらい目にあわせる。自分が悪かったと認めている。',
      trap: '「一晩中かけてた」は責めではなく、早く謝りたかったという意味。',
      use: 'Sorry to put you through all this.（いろいろ大変な思いをさせてごめん）' },

    // R fix: V2 (blind 55 %): "call her back" was a filler; now "machine" heard as the answering machine
    // why: doesn't want to get back together ← the first half heard without "over a machine"; long message ← "machine" heard
    //   as a remark about the answering machine itself
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'machine', seg: [25.0, 29.5],
      stem: 'What does Rachel’s line about “a machine” do?',
      choices: ['It puts off making up until they meet', 'It says she doesn’t want to get back together',
                'It apologizes for such a long message'], a: 0,
      cue: 'get back together のあと、over で始まる部分。',
      line: 'I don’t want to get back together *over a machine*.',
      said: '「留守電で仲直りなんてしたくない」と言う。',
      mean: 'over a machine ＝ 留守電ごしに。仲直りは会ってしたい、という意味。',
      trap: '前半だけ聞くと逆の意味になる。否定は文の最後まで聞く。',
      use: 'I don’t want to do this over text.（これはメールで済ませたくない）' },

    // why: tonight ← "I'm going to go to bed now" comes first; evening ← "work" heard as the end of her day
    { id: 'n1', skill: 'number', level: 'B1', point: 'when', seg: [32.0, 39.5],
      stem: 'When does Rachel plan to come by?',
      choices: ['Tomorrow morning, before work', 'Tonight, before she goes to bed', 'Tomorrow evening, after work'],
      a: 0,
      cue: 'but のあと、work と時刻。',
      line: 'but on my way to work *tomorrow morning*, I’m going to stop by around *8:30*.',
      said: '「もう寝るけど、明日の朝、仕事に行く途中で8時半ごろ寄るね」。',
      mean: 'on my way to work ＝ 出勤の途中で。stop by ＝ ちょっと立ち寄る。',
      trap: '「もう寝る」が先に聞こえるので今夜と思いやすい。but のあとが本題。',
      use: 'I’ll stop by on my way home.（帰りにちょっと寄るね）' },

    // R fix: V2 (blind 70 %): "careful advice" was a filler; now the sincere reading
    // why: warming to her ← he joins in with ideas, read as interest (sincerity flip); to tease ← he flips his answer at once, which can
    //   sound playful
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'puppy', seg: [43.6, 54.3],
      stem: 'How does Ross deal with Chloe’s question about a puppy?',
      choices: ['He agrees to anything to get her out', 'He’s warming to her and wants to help',
                'He changes his answer just to tease her'], a: 0,
      cue: '答えがすぐ変わることと、そのあとの Listen。',
      line: 'How about a big one? — Well, I promised… — *Well, then a small one.* Listen, we kind of have to get going.',
      said: '「大きいのは？」→彼女が何か言いかけると「じゃあ小さいの」。すぐ「そろそろ出ないと」。',
      mean: '答えはどうでもよく、早く帰ってほしい。Listen は本題に話を移す合図。',
      trap: 'すぐ答えを変えるのはからかいに見えるが、直後に急かしている。',
      use: 'Listen, I kind of have to go.（あのさ、そろそろ行かないと）' },

    // R fix: V2 (blind 70 %): the key was the only vivid choice; reworded, and a playing-dumb distractor
    // why: pretending ← "You need shoes?" heard as playing dumb about where they are; teasing ← a question
    //   back can sound like a joke about her
    { id: 'h2', skill: 'humor', level: 'C1', point: 'shoes', seg: [53.9, 59.5],
      stem: 'Why does Ross’s reply to “where’s my shoes?” get a laugh?',
      choices: ['He’d rather she left without them than wait', 'He’s acting as if he hasn’t seen them',
                'He’s teasing her for always losing things'], a: 0,
      cue: '靴の質問に、質問で返している。',
      line: 'Wait, where’s my shoes? — *You need shoes?* Okay.',
      said: '「待って、靴どこ？」に「靴、いる？……分かった」と返す。',
      mean: '急がせたいあまり、靴なしで帰らせようとしている。当たり前の物を疑うほどあせっている。',
      trap: '質問に質問で返すのは、からかいとは限らない。ここは早く出てほしい気持ちの表れ。',
      use: 'Do you really need that?（それ、本当に要る？）' },

    // R fix: V2 (blind 55 %): "work earlier" was a filler; now the near sound "get back at"
    // why: get back at ← near sound: "get back together with me" heard without "together"; found out ← "it turns out that she…" heard as bad news
    { id: 'd2', skill: 'detail', level: 'B1', point: 'rushing', seg: [59.8, 68.6],
      stem: 'What reason does Ross give Chloe for the rush?',
      choices: ['His girlfriend wants to get back with him', 'His girlfriend wants to get back at him',
                'His girlfriend has found out all about Chloe'], a: 0,
      cue: 'it turns out that she のあと、wants の後ろ。',
      line: 'it turns out that she… *she wants to get back together with me*.',
      said: '「昨夜話した彼女、実はよりを戻したいって」と説明する。',
      mean: 'get back together ＝ よりを戻す。だから急いでいる。',
      trap: 'turns out は悪い知らせに聞こえやすい。back の後ろが together か at かで逆になる。',
      use: 'It turns out the store was closed.（結局、店は閉まってた）' },

    // R fix: V2 (blind 60 %): key reworded away from the stock "guilty and scared". Still the savvy reading: open
    // why: sad about Chloe ← he says it to Chloe, so the other feelings seem to be about her (right mechanism, wrong
    //   target); unsure ← "many things" heard as doubt about Rachel herself (refuted at 95.9 s: "Yes, you can, very
    //   much")
    // anchor: 72.8–74.9 s "Yes, yes, I am" then "one of the many things"; at 101.7–112.5 s he names the rest: "I'm in
    //   hell… what is she going to say when I tell her what I did?"
    { id: 'nt3', skill: 'attitude', level: 'C2', point: 'feeling', reveals: ['tellher'], seg: [70.6, 76.4],
      stem: 'When Ross adds “one of the many things I’m feeling”, what is he keeping back?',
      choices: ['That he dreads telling Rachel what he did', 'That he is sad to say goodbye to Chloe',
                'That he is not sure he wants Rachel back'], a: 0,
      cue: 'Yes を2回言ったあと、付け足した一言。',
      line: 'You must be so happy. — Yes, yes, I am. *One of the many things I’m feeling.*',
      said: '「すごくうれしいでしょ」に「うん。いろんな気持ちの一つだけど」。',
      mean: 'うれしいのは本当だが、残りは言えない。あとの「地獄だ」「したことを話したら」で、罪悪感とあせりだと分かる。',
      trap: '相手がクロエなので彼女への気持ちと取りやすい。言わなかった中身は、あとの場面で答え合わせ。',
      use: 'Excited? That’s one word for it.（ワクワク？まあ、そうとも言えるね）' },

    // R fix: V2 and §9.4 (blind 60 %): the title ("Tries to Hide") answered "what do they talk him into"; now asks their reason
    // why: never find out ← "make sure she doesn't find out" comes right after; broken up ← the couple's history,
    //   which nobody brings up here
    { id: 'g1', skill: 'gist', level: 'B2', point: 'advice', reveals: ['deathbed', 'onboard', 'tellher'], seg: [101.3, 151.7],
      stem: 'Why, in his friends’ view, should Ross keep quiet?',
      choices: ['Telling would only hurt her and end things', 'She would never find out about it anyway',
                'It happened while they were broken up'], a: 0,
      cue: '「He’s right」のあと、二人が続けて言う理由。',
      line: 'Nobody’s going to benefit, and *you’re just going to hurt her*. — Yeah, and *there won’t be a relationship left*…',
      said: '友人たちは「傷つけるだけ」「関係が残らない」と言い、正直派のロスも折れる。',
      mean: '理由は二つ。彼女を傷つけることと、やり直すはずの関係が壊れること。',
      trap: '直後の「ばれないようにしよう」は理由ではなく次の作戦。理由は He’s right のあとの二文。',
      use: 'Let’s wait till the timing’s right.（タイミングを見て話そう）' },

    // R fix: V2 (blind 50 %): the despair distractor gave way to the title-led "he can keep it from her"
    // why: already knows ← "what is she going to do?" heard as her reaction to news she has; keep it from her ← the
    //   title ("Tries to Hide") and "I'm in hell" read as a plan to hide it
    { id: 'i3', skill: 'infer', level: 'B2', point: 'tellher', seg: [101.4, 112.7],
      stem: 'At the start of the talk, what is Ross assuming?',
      choices: ['That he’s going to tell Rachel', 'That Rachel already knows the truth', 'That he can keep it from Rachel'],
      a: 0,
      cue: '最後の文、her の前の小さな接続詞。',
      line: 'What is she going to say *when I tell her* what I did?',
      said: '「したことを話したら、彼女は何て言うだろう」と悩む。',
      mean: 'if（もし）ではなく when（〜とき）なので、話すことはもう決めている前提。',
      trap: '隠す話だと思うと「隠せる」前提に聞こえる。when I tell her は話す前提。',
      use: 'When I tell my boss, he’ll freak out.（上司に話したら、きっと大騒ぎだ）' },

    // R fix: V2 (blind 55 %): "rate how smart he is" was a filler; now a parody of Ross (wrong target)
    // why: copies Ross ← the meeting-style words heard as a parody of Ross's way of talking (wrong target); Rachel
    //   foolish ← the question
    //   heard as aimed at the woman who has just taken him back
    { id: 'h3', skill: 'humor', level: 'C1', point: 'dumb', seg: [112.4, 119.5],
      stem: 'Why does the reply about “the more important question” get a laugh?',
      choices: ['Its formal lead-in ends in a plain insult', 'It copies the way Ross talks, to mock him',
                'He means Rachel was foolish to forgive Ross'], a: 0,
      cue: '改まった前置きと、最後の短い質問の差。',
      line: 'I think we should *address the more important question*. *How dumb are you?*',
      said: '「もっと大事な問題を話し合おう。君はどれだけバカなんだ？」と返す。',
      mean: 'address the question は会議のような言い方。重い前置きから、ただの悪口に落とす。',
      trap: '答えを求める質問ではない。打ち明ける気のロスへのあきれ。',
      use: 'Before we start, one important question: coffee?（始める前に大事な質問。コーヒー飲む？）' },

    // R fix: V2 (blind 65 %): "no advice" was a filler; now the near miss "honesty for big things"
    // why: tell everything ← "on board" plus "I am" heard as full agreement (the "I'm with you" trap); big things only ←
    //   the right target, the wrong direction: "just not about stuff…" heard as "just about the stuff that matters"
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'onboard', seg: [126.8, 133.6],
      stem: 'When Ross’s friend says he’s “on board”, what does the rest of his turn do?',
      choices: ['Takes most of that agreement back', 'Agrees Ross should tell her everything',
                'Says honesty matters most for big things'], a: 0,
      cue: 'I am のあと、Just not で始まる部分。',
      line: 'I’m on board about the total honesty thing. I am. *Just not about stuff that’s going to get you in trouble.*',
      said: '「正直にっていうのは賛成。本当に。ただ、君が困るようなことは別」。',
      mean: 'on board ＝ 賛成。でも「困ることは言うな」と付けて、今回は話すなと言っている。',
      trap: 'I am と念を押すので全面賛成に聞こえる。Just not のあとが本音。',
      use: 'I’m on board. Just not on Sundays.（賛成だよ。日曜以外ならね）' },

    // R fix: K1 and V2 (blind 55 %): "when Ross is dying" — whose deathbed isn't said; the key now says "the end of a life", and a literal "good mood" reading joins
    // why: good mood ← "wait till the timing's right" heard without the next line; Rachel would kill him ← the
    //   common joke about a partner's fury
    { id: 'h4', skill: 'humor', level: 'C1', point: 'deathbed', seg: [141.5, 150.8],
      stem: 'Why does the advice about waiting for the right time get a laugh?',
      choices: ['The right time he has in mind is the end of a life', 'The right time he means is when she’s in a good mood',
                'It hints Rachel would kill Ross for telling her'], a: 0,
      cue: 'timing’s right のあと、短い一文。',
      line: 'at least *wait till the timing’s right*. And that’s what *deathbeds* are for.',
      said: '「話すなら、せめてタイミングを待て。死の床はそのためにある」。',
      mean: 'deathbed ＝ 死の床。「ちょうどいい時」とは死ぬ間際、つまり事実上「一生言うな」。',
      trap: '「せめてタイミングを待て」だけなら普通の助言。次の一文で「一生言うな」に変わる。',
      use: 'Now’s not the time.（今はその時じゃない）' },

    // why: Do you ← "did you" turns into "didja" and the d slips by; Would you ← the "-dja" ending heard as
    //   "wouldja"
    { id: 's1', skill: 'sound', level: 'B2', point: 'trailq', seg: [158.9, 162.3],
      stem: 'Fill the gap: “___ think about the trail?”',
      choices: ['Did you', 'Do you', 'Would you'], a: 0,
      cue: '文の最初、つながって短くなった2語。',
      line: '*Did you* think about the trail?',
      said: '「足跡（つながり）のことは考えた？」と聞く。',
      mean: 'Did you は「ディジュ」とつながる。もう考えたかを聞く過去形。',
      trap: 'd と y がくっつくと「ジュ」になり、Do you や Would you と聞き分けにくい。母音の「ィ」を聞く。',
      use: 'Did you think about the cost?（費用のこと考えた？）' },

    // R fix: V2 (blind 55 %): "places seen together" was a filler; now a meeting between the two women
    // why: meeting ← "from the woman… to the woman" heard as a path between them, without "finds out"; proof left behind ← "trail" as evidence, the
    //   crime-show sense
    { id: 'ph1', skill: 'phrase', level: 'B2', point: 'trail', seg: [163.4, 175.4],
      stem: 'What does Ross’s friend tell him he must always think about?',
      choices: ['How news could pass from one woman to the other', 'How the two women might end up meeting',
                'The proof he left behind, like notes or calls'], a: 0,
      cue: '2人の女性をつなぐ説明の部分。',
      line: 'The trail *from the woman you did it with to the woman you hope never finds out*',
      said: '「浮気相手から、絶対に知られたくない相手までの道筋」と説明する。',
      mean: 'ここの trail は人から人へ話が伝わる道筋。このあとロスが実際に人の名前をたどる。',
      trap: '証拠や二人が会う話と取りやすい。finds out（知られる）が要。',
      use: 'Word travels fast around here.（ここではうわさがすぐ広まる）' },

    // why: Isaac ← "works with" is first said of Chloe and Isaac; Chloe ← her name opens the chain; Rachel ←
    //   "Phoebe's friends with Rachel" ends it
    { id: 'd3', skill: 'detail', level: 'B1', point: 'jasmine', seg: [179.5, 191.0],
      stem: 'In the chain of names, who works with Phoebe?',
      choices: ['Jasmine', 'Isaac', 'Chloe', 'Rachel'], a: 0,
      cue: 'massage place のあたり、with Phoebe の前。',
      line: '*Jasmine works at the massage place with Phoebe*, and Phoebe’s friends with Rachel',
      said: '「クロエの同僚がアイザック、その妹がジャスミン、ジャスミンはフィービーの同僚」とたどる。',
      mean: 'works with ＝ 同じ職場。名前が次々につながっていく。',
      trap: 'works with は二回出る。最初はクロエとアイザック。誰と誰の組みかを聞き分ける。',
      use: 'My sister works with his cousin.（私の姉が彼のいとこと同じ職場なの）' },

    // R fix: V2 (blind 55 %): "told no one" belonged to nt1; now a future reading of "I tell"
    // why: no one but Isaac ← "I tell" heard as a future plan with a limit; not yet ← "I tell" in the present heard as a
    //   plan, not a habit that already covers last night
    { id: 'i4', skill: 'infer', level: 'B2', point: 'isaac', seg: [192.0, 202.6],
      stem: 'What does Chloe’s answer about Isaac tell Ross?',
      choices: ['She has already told Isaac about them', 'She means she’ll tell no one but Isaac',
                'She’ll tell Isaac soon, but not yet'], a: 0,
      cue: 'right? への返事、everything で終わる文。',
      line: 'you didn’t mention anything to Isaac, right? — Oh, *I tell Isaac everything*.',
      said: '「誰にも言ってない？」「人に言うことじゃないし」「じゃあアイザックにも？」「アイザックには何でも話すの」。',
      mean: '何でも話す相手なら、今回のこともきっと話している。',
      trap: 'I tell は現在形だが、「いつも話す」という習慣。昨夜のことも含まれる。',
      use: 'I tell my sister everything.（姉には何でも話すの）' },

    // R fix: V2 (blind 70 %): "told him before" was a filler; now a deliberate hint. Still open
    // why: lied ← the contradiction read as her being caught out (sincerity flip); dropping a hint ← the second
    //   answer read as a deliberate signal, though she offers it cheerfully, with no pause
    // anchor: 194.2 s "Oh, no… isn't anybody's business", then 200.9 s "Oh, I tell Isaac everything": she offers the
    //   second answer herself, cheerfully, as if nothing contradicts the first
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'isaac', seg: [192.0, 202.6],
      stem: 'Taken together, what do Chloe’s two answers show?',
      choices: ['To her, Isaac doesn’t count as “anyone”', 'She lied at first so Ross wouldn’t worry',
                'She’s dropping a hint that Isaac knows'], a: 0,
      cue: '二つの返事が、どちらも Oh で始まること。',
      line: 'isn’t *anybody’s business*, you know? … Oh, *I tell Isaac everything*.',
      said: '「人に言うことじゃないよね」と言った少しあとで、「アイザックには何でも話すの」と平気で言う。',
      mean: '彼女の中でアイザックは「人」に入らないほど近い。ごまかしではなく、矛盾に気づいていない。',
      trap: '矛盾はうそに見えるが、隠す人は自分から言わない。平気で言うなら「誰にも」の範囲がずれている。',
      use: 'I told no one. Well, except my mom.（誰にも言ってない。まあ、母は別）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'happen', seg: [217.3, 219.4],
      stem: 'Type what Ross says: “See, I ___ a girlfriend.” (3 words)', answer: 'happen to have',
      cue: 'see, I のあと、a girlfriend の前の3語。',
      line: 'see, I *happen to have* a girlfriend.',
      said: '「実はさ、僕には彼女がいるんだ」と切り出す。',
      mean: 'happen to have ＝ たまたま〜がある。ここは「実は〜なんだ」と、言いにくいことを控えめに出す言い方。',
      trap: 'to は「タ」と弱く、have は短い。happen と続けて一息に聞こえる。',
      use: 'I happen to know the owner.（実はオーナーと知り合いなんだ）' },

    // R fix: V2 (blind 70 %): "hardly talks" was a filler; now "again" tied to the wrong verb
    // why: kept the secret ← "promise not to tell" taken at face value; Ross asked twice ← "again" tied to
    //   Ross's request instead of to "tell"
    { id: 'i5', skill: 'infer', level: 'C1', point: 'again', seg: [231.5, 238.5],
      stem: 'What does Isaac’s promise about his sister give away?',
      choices: ['He has already told her about it', 'He has kept the secret from her so far',
                'He’s promising because Ross asked twice'], a: 0,
      cue: '約束の文の、いちばん最後の一語。',
      line: 'I can promise *not to tell her again*.',
      said: '「妹に言わないでくれ」に「もう二度と言わないって約束できるよ」と答える。',
      mean: 'again（また）があるので、すでに一度言った後。約束しても手遅れ。',
      trap: 'promise だけ聞くと安心できる返事。文末の again が、もう話したことを示す。',
      use: 'I promise not to be late again.（もう遅刻しないって約束する）' },

    // R fix: V2 and S1 (blind 70 %): "caught" in the stem hinted at a catch; the distractors are now replies to the other two readings
    // why: never hear it ← "promise not to tell" heard as the yes he asked for (the お礼 frame); haven't told yet ←
    //   "not… again" heard as "not yet", the opposite of what it implies
    // anchor: 235.5 s "not to tell her again": "again" means once already; the next scene opens on the sister saying
    //   "You did a bad thing" (246.8 s)
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'again', seg: [231.5, 238.5],
      stem: 'Which reply from Ross would match what Isaac has just said?',
      choices: ['“Wait, you already told her?”', '“Great. So she’ll never hear it from you?”',
                '“Wait, so you haven’t told her yet?”'], a: 0,
      cue: '約束の最後の一語を聞いたら、何と返す？',
      line: 'I can promise not to tell her *again*.',
      said: '「妹には言うなよ」に「もう二度と言わないと約束できるよ」と返される。',
      mean: '約束の形だが、again が「もう言った」と告げている。分かったなら、お礼ではなく「え、もう言ったの？」と返すはず。',
      trap: '頼みに約束が返るとお礼を言いたくなる。返事は形でなく、相手が実際に言った中身に返す。',
      use: 'Wait, you already sent it?（待って、もう送っちゃったの？）' },

    // R fix: V2 and §9.4 (blind 65 %): the title ("and Fails") answered it; now asks how far the news got
    // why: Phoebe ← "and he knows Phoebe, too" is the last link named; roommate ← "I told him" heard as the end of
    //   the line
    { id: 'g2', skill: 'gist', level: 'B2', point: 'end', reveals: ['roommate'], seg: [241.5, 291.5],
      stem: 'By the end, how far along the chain has the news got?',
      choices: ['All the way to Rachel herself', 'As far as Phoebe, but no further',
                'No further than Jasmine’s roommate'], a: 0,
      cue: '最後のお願いと、それへの返事。',
      line: 'Please tell me you didn’t say anything to Rachel… — I’m sorry. *Was I not supposed to?*',
      said: 'ジャスミンに頼んでひと安心。でもガンサーに確かめると「言っちゃだめだった？」。',
      mean: 'ガンサーはもう話していた。道筋の最後で、レイチェルに届いてしまった。',
      trap: '最後に名前が出るフィービーで止まると思いやすい。Rachel への問いの答えを聞く。',
      use: 'Was I not supposed to say that?（それ、言っちゃだめだった？）' },

    // R fix: V2 (blind 65 %): "Phoebe" was off the moment; now two readings of his echo
    // why: misheard ← "I'm agreeing" read as setting the record straight (a Japanese 確認 frame); mocking ← he
    //   repeats her "Very bad", which can sound like an echo to mock her
    { id: 'pr3', skill: 'pragma', level: 'C1', point: 'agreeing', seg: [246.4, 256.0],
      stem: 'Why does Ross say “I’m agreeing with you” to Jasmine?',
      choices: ['She keeps scolding though he already agrees', 'He thinks she has misheard what he said',
                'He’s mocking her by echoing her words'], a: 0,
      cue: 'Very bad が何回続いたか、そのあとの一言。',
      line: 'You did a bad thing. — Yes, I did. — *Very bad.* — Very bad. — *Very, very bad.* — *I’m agreeing with you.*',
      said: '「悪いことしたわね」「とても悪い」が続き、「だから、同意してるって」と言う。',
      mean: 'もう認めているのに責め続ける彼女を「分かったから、もうやめて」と止めている。',
      trap: '形は事実の確認だが、働きは「もう十分」。同じ言葉が重なったあとの一言はストップの合図。',
      use: 'Okay, I get it. I’m agreeing with you.（分かったって。同意してるよ）' },

    // R fix: V2 (blind 65 %): every choice now uses "work", so only the meaning tells them apart
    // why: working out ← "work it out" heard as exercise (katakana ワークアウト); what to tell her ← "work out" as
    //   "figure out", with the whole talk about telling
    { id: 'ph2', skill: 'phrase', level: 'B1', point: 'workout', seg: [259.8, 268.2],
      stem: 'What does Ross say he wants most with his girlfriend?',
      choices: ['To work things out and stay together', 'To start working out with her at the gym', 'To work out what to tell her'],
      a: 0,
      cue: 'more than anything のあと、just のあと。',
      line: 'I want more than anything to just *work it out* with her',
      said: '「彼女を愛してるし、何よりうまくやり直したいんだ」と頼む。',
      mean: 'work it out ＝ 問題を解決してうまくやる。ここは関係の修復。',
      trap: 'カタカナのワークアウト（運動）と取りやすい。work it out with 人 は「話し合って解決する」。',
      use: 'I’m sure we can work it out.（きっと解決できるよ）' },

    // R fix: K6 and V2 (blind 50 %): the key was the only two-part choice; all three are now two-part
    // why: help keep Phoebe quiet ← "knows Phoebe" heard as a reason he could help; already told Phoebe ← "I told
    //   him" heard as him passing it on
    { id: 'd4', skill: 'detail', level: 'B1', point: 'roommate', seg: [273.6, 281.2],
      stem: 'Why does Jasmine say Ross should talk to her roommate?',
      choices: ['She told him, and he knows Phoebe too', 'He knows Phoebe, so he can help keep her quiet',
                'He told Phoebe, so it may be out already'], a: 0,
      cue: 'because のあと、2つの理由。',
      line: 'you should probably talk to my roommate *because I told him and he knows Phoebe, too*.',
      said: '「ルームメイトと話したほうがいいかも。彼に話しちゃったし、彼もフィービーを知ってる」。',
      mean: 'まだ広がるおそれがある、という警告。',
      trap: 'knows Phoebe は「助けになる」ではなく「伝わるおそれ」。because 以下が理由。',
      use: 'You should probably talk to Ken first.（まずケンと話したほうがいいかも）' },
  ]
};
