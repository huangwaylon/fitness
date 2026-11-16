// REVIEW 2026-11-16: pass 9, fix 13, drop 0, new 0; ear checks 0
// “Joey Finds Out About Chandler & Monica | Friends” (the official Friends channel, Best of Season 5): Chandler and
// Monica plan a secret weekend away with cover stories; back home, small details (an eyelash curler, a Donald Trump
// sighting) slip out in front of Joey, and once he learns the truth they beg him to keep it quiet.
// Segments from the captions, words from whisper (2026-11-16). Whisper's timings drift (and it loops a line) from 70 s
// to 128 s and runs 178–229 s together, so all times come from the captions. The sources differ at 23 s ("dark out" /
// "darker"), 61.4 s ("not, though" / "not, so"), 84.4 s ("Damn Rolos" / "Dan Rolos"), 90.8 s ("That was" / "Oh, it
// was"), 159.7 s ("so I'm waiting" / "saw him waiting") and 209.7 s (whisper garbles the first half of "The reason…");
// no key rests on those words, and lines quote around them. Left out on purpose: the "naked" lines at 48–53 s, the
// silent discovery at 178–190 s (visual), and "You? And you?" (pointing).
// EAR CHECK: none (speakers are settled by names in the audio: "Mr. Bing", "Hey Monica", "Rach")
import type { Clip } from '../types.ts';

export const joeyfinds: Clip = {
  id: 'joeyfinds', video: 'tGlX74DANF0', title: 'Joey Finds Out About Chandler & Monica',
  dur: 255, wpm: 168, band: 'fast',
  tags: ['恋愛', '友だち'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // why: ten ← a nearby number that "nine" could be confused with at speed; noon ← "noon" is said right after
    { id: 'n1', skill: 'number', level: 'B1', point: 'nine', seg: [17.3, 21.0], keep: true,
      stem: 'What time is the person at the door told it is?',
      choices: ['Nine', 'Ten', 'Noon'], a: 0,
      cue: 'What time is it? のすぐあと。',
      line: 'What time is it? — Uh, *nine*.',
      said: '「今何時？」と聞かれ、「えーと、9時」と答える。',
      mean: 'nine ＝ 9時。言いよどみの uh のあとに短く答えている。',
      trap: 'すぐあとに noon（正午）が出てくるので混ざりやすい。最初の返事の数を聞く。',
      use: 'What time is it? — Ten-thirty.（今何時？—10時半）' },

    // R fix: K5: "The other one" was unclear; now "The one asking".
    // why: night ← "nine" + "dark" heard as nine in the evening; winter ← world knowledge fills in a reason the audio
    //   doesn't give
    { id: 'd1', skill: 'detail', level: 'B2', point: 'dark', reveals: ['nine'], seg: [22.5, 31.6],
      stem: 'When told it seems dark out, how is the darkness explained?',
      choices: ['The one asking always sleeps until noon', 'It is nine at night, not in the morning', 'Winter mornings here are always dark'], a: 0,
      cue: 'that’s because のあと。',
      line: 'that’s because you *always sleep till noon*, silly. This is what nine looks like.',
      said: '「外が暗い」と言われ、「いつも昼まで寝てるからだよ。9時ってこういうものなの」と返す。',
      mean: '暗いのを相手の寝坊のせいにして、ごまかしている。',
      trap: '暗いと聞くと夜を想像しやすい。理由は that’s because の後に言っている。',
      use: 'That’s because you never check your email.（それはメールを見ないからだよ）' },

    // why: night ← "nine" + "dark" read as evening; cloudy noon ← "noon" heard, and a gray sky would explain the dark
    { id: 'i1', skill: 'infer', level: 'C1', point: 'realtime', reveals: ['nine'], seg: [22.5, 37.5],
      stem: 'From the talk at the door, what time is it really?',
      choices: ['Before dawn, well before nine', 'Nine at night, well after dark', 'Around noon, on a cloudy day'], a: 0,
      cue: '最後の短い一言に出てくる景色。',
      line: 'This is what nine looks like. … Watch that *sunrise*.',
      said: '「9時ってこういうもの」と言い張るが、最後に「日の出を見てて」と言ってしまう。',
      mean: '日の出前なら、まだ早朝。9時というのは、こっそり帰るためのうそ。',
      trap: 'nine と dark で夜を考えやすいが、sunrise が出れば朝、しかも日の出前。',
      use: 'I’m up before sunrise.（日の出前に起きてる）' },

    // R fix: K1: "tiptoeing around the apartment at night" is one case of what they're tired of (the dawn scene just
    //   showed it), so a fluent listener could defend it. Now "rushing around busy" ("running around all the time").
    // why: early ← the scene just before is at dawn, so "tired of" seems to be about waking early; busy ← "…around all
    //   the time" heard as "running around all the time"
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'sneak', seg: [39.6, 43.7],
      stem: 'What are the two of them tired of?',
      choices: ['Hiding their relationship from people', 'Getting up so early to see each other', 'Rushing around, busy all of the time'], a: 0,
      cue: 'tired of のあとの動詞と around。',
      line: 'I’m really getting tired of *sneaking around* all the time.',
      said: '「いつもこそこそするのに疲れてきた」と言う。',
      mean: 'sneak around ＝ 人に隠れてこそこそする。二人の関係を隠していること。',
      trap: '〜 around all the time を「忙しい」と取りやすい。sneak around は「隠れて行動」。',
      use: 'I’m tired of sneaking around.（こそこそするのはもう嫌）' },

    // R fix: V2 (blind 80 %): "stop seeing each other" was a filler. All three now start from the trip or the weekend;
    //   "tell Joey" picks up "What about Joey?" at the end.
    // why: tell Joey ← "tired of sneaking around" usually leads to coming out, and "What about Joey?" ends the scene;
    //   stay in ← "no interruptions… the whole weekend" heard as shutting themselves in
    { id: 'g2', skill: 'gist', level: 'B1', point: 'plan', reveals: ['whatif'], seg: [39.6, 67.6],
      stem: 'What do the two decide in the first scene?',
      choices: ['To go away together, each with a cover story', 'To go away together and tell Joey the truth',
                'To stay in and keep everyone away all weekend'], a: 0,
      cue: '前半の提案と、後半の「言い訳」の相談。',
      said: '隠れるのに疲れた二人が、週末の旅行を決め、それぞれの言い訳を考える。',
      mean: '秘密をやめるのではなく、もっと上手に隠して二人で出かける計画。',
      trap: '最後の What about Joey? で打ち明ける話に聞こえやすいが、二人は逆に口実を作る。',
      use: 'Let’s get away for the weekend.（週末どこかへ行こう）' },

    // R fix: V2 (blind 70 %): "a memory of a past trip" was weak. Now "a daydream" (the past form read as unreal), the
    //   strongest misreading of "What if we went…".
    // why: daydream ← "went" after "what if" read as the unreal past (仮定法 = ありえない話); a worry ← "what if" heard as
    //   もし〜したらどうしよう
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'whatif', seg: [43.7, 47.7],
      stem: 'How is the weekend away first brought up?',
      choices: ['As a real suggestion for a trip', 'As a daydream he knows won’t happen', 'As a worry about what might happen'], a: 0,
      cue: 'you know what のあと、what if で始まる文。',
      line: 'Hey, you know what? *What if we went away* for the whole weekend?',
      said: '「ねえ、週末まるごと出かけるのはどう？邪魔も入らないし」と持ちかける。',
      mean: 'What if we + 過去形? ＝「〜してみない？」という控えめな提案。',
      trap: '過去形を「ありえない話」、what if を心配と取りやすい。提案の決まった形。',
      use: 'What if we got takeout tonight?（今夜はテイクアウトにしない？）' },

    // why: cooking event ← the "chef thing" is the other person's story; Jersey ← "Jersey" is said a moment later
    { id: 'd2', skill: 'detail', level: 'B1', point: 'cover', seg: [53.6, 58.0],
      stem: 'What cover story does Chandler plan for himself?',
      choices: ['A work conference', 'A cooking festival', 'A trip to Jersey'], a: 0,
      cue: 'I could say that I have のあと。',
      line: 'I could say that I have *a conference*, and you can say you have a… chef thing.',
      said: '「僕は会議があると言って、君はシェフの何かがあると言えばいい」と言う。',
      mean: '自分は会議、相手は料理の仕事。二人別々の言い訳を用意している。',
      trap: 'chef thing は相手の言い訳。I と you のどちらの話かを分けて聞く。',
      use: 'I could say I have a meeting.（会議があるって言えばいいか）' },

    // R fix: V2 (blind 55 %): "take Joey along" was weak. Now "a cover Joey would never believe" (Joey is named right
    //   after).
    // why: no such fair ← "you know you're not" heard as "that's not a real thing"; Joey won't buy it ← "What about
    //   Joey?" is said right after
    { id: 'h1', skill: 'humor', level: 'C1', point: 'fair', seg: [57.8, 64.2],
      stem: 'Why does Monica’s comment about a culinary fair get a laugh?',
      choices: ['She gets excited about a trip that is only a cover', 'She names a fair that does not really exist',
                'She picks a cover story Joey would never believe'], a: 0,
      cue: '彼女の一言のあと、彼の短い返し。',
      line: 'Oh, I’ve always wanted to go to this culinary fair… — Okay, you know *you’re not*…',
      said: '言い訳のはずのフェアに「ずっと行きたかったの」と喜び、「本当には行かないよね」と返される。',
      mean: 'ただの口実なのに本気で楽しみにしている。そのずれが笑い。',
      trap: 'you’re not を「そんなものはない」と取りやすいが、「行かない」の意味。',
      use: 'You know that’s just an excuse, right?（それ、ただの口実だよね）' },

    // why: surprise ← "bust" heard like "burst", a surprise or a big moment; found out ← "bust" heard as "busted" (caught),
    //   which fits a secret trip
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'bust', seg: [97.9, 103.0],
      stem: 'When Joey sums up the weekend, what does he suggest?',
      choices: ['That it went really badly', 'That it was a big surprise', 'That it was found out'], a: 0,
      cue: 'your weekend was のあとの2語。',
      line: 'Uh, so your weekend was *a total bust*?',
      said: '会議がひどかったと聞き、「じゃあ週末は散々？」と聞く。',
      mean: 'a bust ＝ 大失敗、期待外れ。total が「完全に」と強める。',
      trap: 'bust は busted（ばれた）と似ていて、秘密がばれた話に聞こえやすい。a bust は失敗。',
      use: 'The party was a total bust.（パーティーは大失敗だった）' },

    // why: earrings / sweater ← other things a woman might leave behind, which fits Joey's guess a moment later
    { id: 'd4', skill: 'detail', level: 'B1', point: 'curler', seg: [112.3, 119.3],
      stem: 'What did the hotel say was left in Chandler’s room?',
      choices: ['An eyelash curler', 'A pair of earrings', 'A woman’s sweater'], a: 0,
      cue: 'someone left のあと。',
      line: 'Said someone left *an eyelash curler* in your room.',
      said: '「泊まったホテルから電話。部屋にビューラーの忘れ物があったって」。',
      mean: 'eyelash curler ＝ ビューラー。女性の持ち物と考えるのが普通。',
      trap: 'eyelash も curler も聞き慣れない語。left の後ろの名詞のかたまりを聞く。',
      use: 'I left my charger in the room.（部屋に充電器を忘れました）' },

    // R fix: V2 (blind 65 %): "belongs to Joey" was a filler. Now Joey's own guess (a woman left it) as a boast, and a
    //   plausible cover (the last guest).
    // why: brags ← Joey's guess a moment later ("some girl… left it there") pulled onto Chandler; last guest ← "the
    //   hotel… called" sets up blaming someone else
    { id: 'h2', skill: 'humor', level: 'C1', point: 'mine', reveals: ['curler'], seg: [116.2, 123.5],
      stem: 'Why does Chandler’s quick answer about the hotel’s call get a laugh?',
      choices: ['He’d rather own a curler than admit a woman', 'He brags that a woman left it in his room', 'He blames it on the guest before him'], a: 0,
      cue: '忘れ物の話のすぐあと、短い返事。',
      line: 'Said someone left an eyelash curler in your room. — *Yes, that was mine.*',
      said: 'ビューラーの忘れ物を伝えられ、すぐに「ああ、それ僕の」と答える。',
      mean: '女性がいたと知られるくらいなら、自分の物だと言い張る。苦しいうそが笑い。',
      trap: '次の Joey の推理（女の子の物）と混ざりやすい。Chandler の返事は「僕の物」。',
      use: 'Oh, that’s mine. Thanks.（あ、それ私のです。どうも）' },

    // why: would make ← "have" shrinks to "uh" ("woulda") and seems to vanish; will make ← "would" and "will" share
    //   the w-start; had made ← the "-d" + "made" heard as a past perfect
    { id: 's1', skill: 'sound', level: 'B2', point: 'sense', seg: [125.1, 131.0],
      stem: 'Fill the gap: “Yes, that ___ more sense.”',
      choices: ['would have made', 'would make', 'will make', 'had made'], a: 0,
      cue: 'that の直後、つながった短い音。',
      line: 'Yes, that *would have made* more sense.',
      said: '「うん、そのほうが筋が通ってたね」。would have は「ウダヴ」。',
      mean: 'would have made ＝（実際は違うが）そうなら〜だった、という形。',
      trap: 'have が「ア」まで弱くなり、would make に聞こえやすい。消えそうな音も1語。',
      use: 'That would have been nice.（それだったら良かったのに）' },

    // R fix: V2 (blind 65 %): the key was the only two-part choice. All three now open "Granting the guess makes
    //   sense" and differ in what follows.
    // why: owns up ← "made more sense" heard as agreeing that is what happened; sorry ← the Japanese frame: owning up
    //   after a friend's hurt words
    // anchor: 125.6–127.8 s Joey's guess ("you hooked up with some girl"); 129.1–130.2 s "would have made" (it didn't
    //   happen that way); 132.6–135.0 s Joey: "I don't even feel like I know you anymore" (he took the curler story as true)
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'sense', seg: [125.1, 135.6],
      stem: 'With “Yes, that would have made more sense”, what is Chandler doing?',
      choices: ['Granting the guess makes sense, but keeping his story', 'Granting the guess makes sense, and owning up to it',
                'Granting the guess makes sense, and saying sorry'], a: 0,
      cue: 'would have の形と、そのあとの Joey の反応。',
      line: 'I figured you hooked up with some girl… — Yes, that *would have made* more sense. — I don’t even feel like I *know you* anymore',
      said: '「女の子の忘れ物かと」に「そのほうが筋が通る」と返し、Joey は「お前が分からない」。',
      mean: 'would have は「そうだったら」の形で、事実は認めていない。理屈は認めても、うそは守る。',
      trap: 'made more sense を「その通り」と取りやすい。would have は事実と別。',
      use: 'That would’ve been the smart move.（それが賢いやり方だったろうね）' },

    // why: glad ← "feel like I know you" heard as warmth; angry at a lie ← the audience knows it's a lie, but Joey
    //   believes the curler is Chandler's
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'know', seg: [128.6, 135.6],
      stem: 'After Chandler’s answer, how does Joey feel about his friend?',
      choices: ['Hurt; his friend feels like a stranger', 'Glad; he has learned something new about him', 'Angry; he has caught him in a lie'], a: 0,
      cue: 'I don’t even のあと、anymore まで。',
      line: 'You know, I *don’t even feel like I know you anymore*, man.',
      said: '「なんだか、もうお前のことが分からないよ」と言う。',
      mean: 'even と anymore で、親友が遠く感じる寂しさを表している。',
      trap: 'know you だけ拾うと親しみに聞こえる。Joey はうそに気づいておらず、話を信じたうえで戸惑っている。',
      use: 'I feel like I don’t know you anymore.（もうあなたが分からない）' },

    // R fix: V2 (blind 55 %): "a threat to tell all" was weak. Now "a trivial little question", the anticlimax read the
    //   wrong way (the question is wild, not small).
    // why: apology ← "I don't even feel like I know you" sounds like hurt leading to a demand for sorry; trivial ← a
    //   yes/no question after a big build-up heard as a letdown
    { id: 'h3', skill: 'humor', level: 'C1', point: 'cruise', seg: [136.2, 148.5],
      stem: 'Why does Joey’s one big question get a laugh?',
      choices: ['A grave build-up ends in a far-fetched theory', 'A grave build-up ends in a plea for an apology',
                'A grave build-up ends in a trivial little question'], a: 0,
      cue: '前置きの重さと、最後の質問の中身。',
      line: 'I’m just gonna ask you this one time… *Were you, or were you not, on a gay cruise?*',
      said: '「一度だけ聞く。何て答えても信じる」と重々しく前置きし、ある船旅に行ったかと聞く。',
      mean: 'ビューラーから、まるで見当違いの推理をしている。重い前置きとの落差が笑い。',
      trap: '真剣な前置きのあとは謝罪や対決が来そうに思える。質問の中身を聞く。',
      use: 'I’ll only ask this once.（一度しか聞かないよ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'believe', seg: [139.9, 142.4],
      stem: 'Type what Joey says: “…and ___, I’ll believe you.” (3 words)', answer: 'whatever you say',
      cue: 'this one time のあと、and に続く部分。',
      line: 'and *whatever you say*, I’ll believe you.',
      said: '「何て答えても信じる」と言う。whatever you は「ワテヴァユ」とつながる。',
      mean: 'whatever you say ＝ 何を言っても。本気で答えを求める前置き。',
      trap: 'what の t が弾んで「ワレ」に近く聞こえる。3語のかたまりで書く。',
      use: 'Whatever you decide, I’ll support you.（どう決めても応援する）' },

    // R fix: V2 (blind 70 %): "met Donald Trump" was weak. Now "saw him too, at a different event" (the cover taken at
    //   face value), which the identical detail refutes.
    // why: heard it from him ← the same story could be passed on, not lived; different event ← her "convention" cover
    //   taken at face value, the same sighting read as chance
    // anchor: 100.6–102.2 s Chandler: "I got to see Donald Trump waiting for an elevator"; 156.0–160.5 s Monica, at "your
    //   convention": "…waiting for an elevator"
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'trump', seg: [155.0, 161.0],
      stem: 'When Monica tells her Donald Trump story, what does it give away?',
      choices: ['She was where Chandler was that weekend', 'She heard the story from Chandler earlier',
                'She saw Trump too, at a different event'], a: 0,
      cue: '前に誰かが同じ話をしていた。最後の細かい部分。',
      line: 'I heard you saw Donald Trump at your convention. — Yeah, … *waiting for an elevator*.',
      said: '友だちに「大会でトランプを見たんだって？」と聞かれ、「エレベーターを待ってた」と答える。',
      mean: 'Chandler の週末の話と、小さな細部まで同じ。別々の出張のはずが、同じ場所にいたと分かる。',
      trap: '別の大会で偶然、と取りやすいが、細部まで同じなら同じ場所。聞いた話なら「見た」と言わない。',
      use: 'Funny, he told the exact same story.（おかしいな、彼もまったく同じ話をしてた）' },

    // R fix: V2 (blind 75 %): only the key tied back to the hotel. Now two choices name the curler in Chandler's room
    //   (hers / Rachel's), and the third misreads "I lost mine".
    // why: Rachel's ← "your eyelash curler" heard as Rachel's being the one at the hotel; never had one ← "borrow"
    //   heard as needing one she never owned
    { id: 'i3', skill: 'infer', level: 'C1', point: 'curler2', reveals: ['curler', 'mine'], seg: [163.9, 168.0],
      stem: 'When Monica asks to borrow one from Rachel, what does it give away?',
      choices: ['That the curler in Chandler’s room was hers', 'That the curler in Chandler’s room was Rachel’s',
                'That she never had a curler of her own'], a: 0,
      cue: 'Rach と呼んだあと、I think のあとの一言。',
      line: 'Hey, Rach, can I borrow your *eyelash curler*? I think *I lost mine*.',
      said: '「ねえレイチェル、ビューラー貸してくれる？自分のをなくしたみたい」と言う。',
      mean: 'ホテルの部屋の忘れ物は、彼女の物だった。だから同じ週末に一緒にいたと分かる。',
      trap: 'your でレイチェルの物と思いやすい。I lost mine と前の忘れ物を結びつける。',
      use: 'Can I borrow your pen? I lost mine.（ペン借りていい？なくしちゃって）' },

    // R fix: V2 (blind 80 %): "help planning another trip" was a filler. Now "help telling the others" and the
    //   Japanese frame (reassurance that he isn't upset).
    // why: help telling ← "telling everyone" is said, so they seem to be planning how to tell; not upset ← the Japanese
    //   frame: after hiding something from a friend, you first ask that he isn't hurt
    { id: 'g1', skill: 'gist', level: 'B1', point: 'promise', seg: [175.0, 230.0],
      stem: 'In the final scene, what do Chandler and Monica want from Joey?',
      choices: ['His promise to keep it to himself', 'His help telling the others gently', 'His word that he isn’t upset'], a: 0,
      cue: '最後の please のあとのお願い。',
      line: 'Please, just *promise you won’t tell*.',
      said: '秘密を知った Joey に、二人は「誰にも言わないと約束して」と何度も頼む。',
      mean: '大騒ぎになるのを避けたいので、口止めをお願いしている場面。',
      trap: 'telling everyone が聞こえると、伝え方の相談に聞こえやすい。頼んでいるのは言わないこと。',
      use: 'Promise you won’t tell anyone.（誰にも言わないって約束して）' },

    // R fix: V2 (blind 50 %): "the others would be upset" was weak. Now "nobody else's business", a reason a couple
    //   could give.
    // why: not sure it would last ← the usual reason for hiding a new couple; private ← "didn't tell anyone" heard as
    //   keeping it private on principle
    { id: 'd5', skill: 'detail', level: 'B1', point: 'reason', seg: [209.2, 213.45],
      stem: 'Why didn’t they tell anyone, they say?',
      choices: ['They didn’t want a big fuss about it', 'They weren’t sure it would last long', 'They felt it was nobody else’s business'], a: 0,
      cue: 'because のあと、out of it まで。',
      line: '…we *didn’t want to make a big deal* out of it.',
      said: '「誰にも言わなかったのは、大ごとにしたくなかったから」と説明する。',
      mean: 'make a big deal out of ～ ＝ 〜で大騒ぎする。騒がれたくなかった。',
      trap: '隠す理由は「続くか分からない」が多いが、ここでは騒ぎを避けたいこと。',
      use: 'Don’t make a big deal out of it.（大げさにしないで）' },

    // why: minor thing ← "no big deal" (たいしたことない) heard in "big deal"; a problem ← "big deal" read as a serious
    //   problem that needs fixing
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'bigdeal', reveals: ['reason'], seg: [209.2, 217.3],
      stem: 'How does Joey answer their reason for keeping quiet?',
      choices: ['It’s huge news, so he has to share it', 'It’s a small thing, so why hide it at all', 'It’s a real problem, so they should stop'], a: 0,
      cue: 'But で始まる返事と、そのあとの一文。',
      line: 'we didn’t want to make a big deal out of it. — *But it is a big deal!* I have to tell someone.',
      said: '「大ごとにしたくなかった」に「でも大ごとだよ！誰かに言わなきゃ」と返す。',
      mean: 'a big deal ＝ 重大なこと。ここでは「すごいニュース」という興奮。',
      trap: 'no big deal（たいしたことない）を知っていると逆に取りやすい。ここは「大ごとだ」。',
      use: 'Getting this job is a big deal.（この仕事が取れたのは大きいよ）' },

    // R fix: V2 (blind 50 %): the key was the only mixed feeling. Now "simply thrilled" (the "great" without the "but")
    //   sits beside it; "kept in the dark for months" was cut (months isn't said).
    // why: doubtful ← "unbelievable" read literally as "can't be true"; simply thrilled ← "it's great" heard, and the
    //   trailing "but…" lost
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'great', seg: [228.9, 241.5],
      stem: 'Once he has promised, how does Joey feel about the news?',
      choices: ['Pleased, though something still bothers him', 'Simply thrilled for the two of them',
                'Doubtful, since it’s hard to believe'], a: 0,
      cue: 'I mean のあとの評価と、最後の but。',
      line: 'Man, this is *unbelievable*. I mean, *it’s great, but*…',
      said: '「信じられない。最高だよ、でも…」と言い、相手も「最高だよね」と返す。',
      mean: 'unbelievable は驚きと喜び。but で何か引っかかる気持ちも残る。',
      trap: 'unbelievable を「信じない」と取りやすい。great のあとの but も聞く。',
      use: 'This is unbelievable! Congrats!（信じられない！おめでとう！）' },
  ]
};
