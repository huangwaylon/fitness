// “Ron Swanson vs. meditation | Parks and Recreation” (the official Parks and Recreation channel, Season 4): Chris makes
// Ron a finalist for assistant city manager, but first takes him to a strip-mall meditation center for a day; Ron
// gets nothing out of it, says so, and gets the job anyway.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈188.3 s (whisper loops "I don't know
// what it is" from 188.7 s). Untested: 82–86 s (a Greek greeting both sources garble), 70.1 s (who says "It doesn't
// look like much"), 145 s (who repeats "Don't try so hard"), 179.5–188.3 s (the gyro line).
// EAR CHECK: 53.9 s s1 — "at odds" with the t flapped into the vowel ("a-dodds"); both sources have "at odds"
// EAR CHECK: 14.6 s x1 — "you'd" reduced almost to "you" before "be a fool"; both sources have "you'd"
// REVIEW 2026-11-16: pass 10, fix 14, drop 0, new 0; ear checks 2
import type { Clip } from '../types.ts';

export const ronMeditation: Clip = {
  id: 'meditation', video: '7lHARAJFSgw', title: 'Ron Swanson vs. meditation', dur: 209, wpm: 169, band: 'mid',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 50 %): "handle the stress" was the weak filler; now Ron's own anti-government reminder
    //   (7–13 s) is the keyword trap. Chris's purpose is stated at 58.3 s ("what it would really mean to work together").
    // why: spending ← "limit reckless government spending" is Ron's pitch, so the test sounds like it checks that;
    //   views ← "the position… should exist" just before, so the step looks like a test of his politics
    { id: 'g1', skill: 'gist', level: 'B2', point: 'together', seg: [0, 64.6],
      stem: 'Why does Chris want one more step before deciding?',
      choices: ['To see if the two of them can work together', 'To see if Ron truly means to cut spending',
                'To see if Ron will soften his views on government'], a: 0,
      cue: '「very different people」のあと、何を考えたいか。',
      line: 'It is crucial… and consider what it would really mean to *work together*.',
      said: '最終候補のロンに、「違う者同士、一緒に働くとはどういうことか一日かけて考えたい」と言う。',
      mean: '瞑想そのものより、二人が組めるかを見るのが目的。',
      trap: '直前にロンが政府不要論を語るので、考えを試す場に思える。目的は最後の文で言われる。',
      use: 'Let’s see if we can work together.（一緒にやれるか試してみよう）' },

    // why: summary ← "That said" read literally as "that is what I said"; reason ← heard like "so", as if his views
    //   lead to the pitch
    // R fix: S1: "That said" isn't his opening phrase (it follows "Chris, I feel I should remind you…"); the stem now
    //   points at the moment without misplacing it.
    { id: 'm1', skill: 'marker', level: 'B2', point: 'thatsaid', seg: [7, 16.4],
      stem: 'Midway through Ron’s pitch, what do his two short words signal?',
      choices: ['A turn to an opposite point', 'A quick summary of his point', 'The reason for what follows'], a: 0,
      cue: '「should exist」のあと、文頭の短い2語。',
      line: 'I do not believe that the position… should exist. *That said*, …',
      said: '「この役職も政府も、あるべきじゃない」と言ったすぐあと、「とはいえ」と続ける。',
      mean: 'That said ＝ とはいえ。前の話を認めた上で、逆の話に切りかえる合図。',
      trap: '「それは言った」と取ると、まとめに聞こえる。That said のあとは逆の話。',
      use: 'It’s pricey. That said, it’s worth it.（高い。とはいえ、その価値はある）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'fool', reveals: ['thatsaid'], seg: [13.3, 16.4],
      stem: 'Type what Ron says: “That said, ___ not to pick me.” (4 words)', answer: 'you\'d be a fool',
      cue: '「That said」のあと。最初の語は短く縮まる。',
      line: 'That said, *you’d be a fool* not to pick me.',
      said: '「とはいえ、私を選ばないのは愚か者だ」と言い切る。',
      mean: 'you’d be a fool not to ～ ＝ 〜しないなんてどうかしている。強い自己アピール。',
      trap: 'you’d の d はほぼ聞こえず、you に近い。縮んだ音も1語と数える。',
      use: 'You’d be crazy not to go.（行かないなんてもったいない）' },

    // R fix: K1 + V4: "limit reckless spending" can fairly be called "spend more wisely", so that distractor was
    //   defensible, and "What does Ron say" made an infer item a detail. Now the stem asks his aim, and "run more
    //   smoothly" is refuted by the examples in the segment (eliminate the post office).
    // why: smoothly ← "limit reckless spending" sounds like a sensible reformer; catch ← "reckless" heard as reckless
    //   people to go after
    { id: 'i1', skill: 'infer', level: 'B2', point: 'inside', seg: [16.2, 29.95],
      stem: 'What does Ron hope to do with the job?',
      choices: ['Shrink the government from the inside', 'Make the government run more smoothly',
                'Catch the people who waste public money'], a: 0,
      cue: '「if it means」のあと、何をしたいか。そのあとの例も。',
      line: 'if it means I’m able to *further limit* reckless government spending.',
      said: '「無駄な政府支出をさらに減らせるなら、もっと深く入っていく」と言う。',
      mean: 'further limit ＝ さらに減らす。目的は中から政府を小さくすること。',
      trap: 'reckless だけ聞くと、改革したい人に思える。further のあとの動詞と例を聞く。',
      use: 'I’m trying to cut back on sugar.（砂糖を控えようとしてる）' },

    // R fix: V2 (blind 55 %): only the key mentioned "the thing he opposes". All three now do, and differ in the one
    //   dimension the idiom settles (inside vs outside vs being fed).
    // why: fed ← "belly" taken literally, as being fed; outside ← "beast" heard as an enemy to attack, missing
    //   "walk deeper into"
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'belly', reveals: ['inside'], seg: [16.2, 22.5],
      stem: 'How does Ron picture himself taking this job?',
      choices: ['Going deep inside the thing he opposes', 'Being well fed by the thing he opposes',
                'Attacking the thing he opposes from outside'], a: 0,
      cue: '「walk deeper into」のあとの言い方。',
      line: 'I will *walk deeper into the belly of the beast*…',
      said: '「さらに怪物の腹の奥まで入っていく」と、この仕事を引き受ける覚悟を語る。',
      mean: 'the belly of the beast ＝ 敵の本拠地のど真ん中。ここでは政府の中。',
      trap: 'belly（腹）や beast（獣）を文字通りに取ると、食事や戦いの話になる。',
      use: 'Time to enter the belly of the beast.（さあ、敵地に乗り込むか）' },

    // R fix: V2 (blind 70 %): "tiny and harmless" isn't a reason anything is funny. Now a cost irony a partial
    //   listener could hear (tearing it all down to cut spending); nothing about cost is said. + reveals inside.
    // why: modest ← "bigger ones will be tougher" heard as harder but reasonable; fortune ← "spending" + "bring all
    //   of this crumbling" heard as an expensive way to save money
    { id: 'h1', skill: 'humor', level: 'C1', point: 'simple', reveals: ['inside'], seg: [22.2, 35.1],
      stem: 'What makes Ron’s split into simple and bigger ideas funny?',
      choices: ['Even his “simple” ideas are drastic', 'His “bigger” ideas are oddly modest',
                'His cuts would cost a fortune to make'], a: 0,
      cue: '「Some are」の例と、そのあとの例の中身。',
      line: 'Some are *simple*, like take down traffic lights… The *bigger ones*… *crumbling to the ground*.',
      said: '「簡単な案は信号機の撤去とか。大きい案は、これを全部崩すこと」と言う。',
      mean: '信号をなくすだけでも大事なのに、本人には「簡単」。普通の物差しとのずれが笑い。',
      trap: 'simple を「小さい」と取ると笑いが消える。費用の話は出ない。言葉と中身の落差を聞く。',
      use: 'That’s the easy part.（そこは簡単なところ）' },

    // why: whole government ← that is his "bigger" idea, said right after; hours ← "post office" heard with a
    //   cost-cutting script
    { id: 'd1', skill: 'detail', level: 'B1', point: 'simple', seg: [24.4, 29.95],
      stem: 'Which of Ron’s ideas does he call the simple ones?',
      choices: ['Removing traffic lights and the post office', 'Bringing the whole government crashing down',
                'Shortening the post office’s opening hours'], a: 0,
      cue: '「Some are simple, like」のあと。',
      line: 'Some are simple, like *take down traffic lights and eliminate the post office*.',
      said: '「簡単なものもある。信号機の撤去や郵便局の廃止とか」と挙げる。',
      mean: 'take down ＝ 取り外す、eliminate ＝ なくす。',
      trap: '政府を崩す話は次の bigger ones の例。simple と bigger の区切りを聞く。',
      use: 'Let’s start with the simple stuff.（簡単なことから始めよう）' },

    // R fix: V2 + K6 (blind 55 %): "really" in the stem cued a hidden feeling, and the key was the only negative
    //   choice. Now a second negative near miss (against it but too polite), refuted by the blunt restatement.
    // why: hear more ← "I'm not sure" heard alone, as an open mind; polite ← a hedge read as 遠慮, missing that he
    //   says it outright the second time
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'notsure', seg: [44.8, 49.95],
      stem: 'How does Ron feel about Chris’s plan?',
      choices: ['Certain he wants no part of it', 'Not sure yet, and wants to hear more',
                'Against it, but too polite to say so'], a: 0,
      cue: '最初の答えのあと、すぐ言い直す。',
      line: 'I’m not sure I’m interested in that. *No, I am sure I am not* interested in that.',
      said: '「興味があるか分からない」と言い、すぐ「いや、興味がないのは確かだ」と言い直す。',
      mean: '最初の言い方は遠回しすぎたので、はっきり断り直した。迷いはない。',
      trap: 'I’m not sure だけ聞くと、迷っているように聞こえる。言い直しのほうが本音。',
      use: 'Actually, no, I’ll definitely pass.（いや、絶対にやめとく）' },

    // why: at ease ← the same "at" + a vowel start, the opposite meaning; apart ← "a-" plus a final stop
    { id: 's1', skill: 'sound', level: 'B2', point: 'odds', seg: [49.6, 54.45],
      stem: 'Fill the gap: “we have often been ___.”',
      choices: ['at odds', 'at ease', 'apart'], a: 0,
      cue: '「very different people」のあと、文の最後。',
      line: 'you and I are very different people, and we have often been *at odds*.',
      said: '「君と私はまったく違う人間で、よく対立してきた」と言う。',
      mean: 'at odds ＝ 意見が合わない。at の t が弾んで「アラッズ」のようにつながる。',
      trap: 'at ease（気楽）は逆の意味。似た音なら、前の very different に合う語を。',
      use: 'We’re at odds over the budget.（予算のことで意見が割れてる）' },

    // R fix: V2 (blind 50 %): "lets the idea go" was a filler. Now a backing-down script (a shorter session),
    //   refuted by "spend a day" and the yoga-pants instruction.
    // why: think it over ← "I'll see you tomorrow" heard as a deadline; shorter ← the usual script after a refusal:
    //   offer less (he said "a quick session" earlier)
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'tomorrow', reveals: ['notsure'], seg: [54.4, 64.6],
      stem: 'How does Chris respond to Ron’s refusal?',
      choices: ['He carries on as if Ron had said yes', 'He gives Ron until tomorrow to decide',
                'He backs down and offers a shorter session'], a: 0,
      cue: '最後の3つの短い文の中身。',
      line: '*Trust me, you’ll love it.* I’ll see you tomorrow. Oh, *wear your yoga pants*.',
      said: '「信じて、きっと気に入る。また明日。あ、ヨガパンツで来てね」と言う。',
      mean: '断られたのに、行く前提で服装まで指示する。返事を聞き入れずに押し切っている。',
      trap: 'See you tomorrow を「明日まで考えて」と取りやすい。服の指示は、行く前提の合図。',
      use: 'Trust me, you’ll love this place.（信じて、この店きっと気に入るよ）' },

    // R fix: V2 (blind 50 %): "best" was the obvious sales-talk pick against "cheapest". Now "biggest", a near sound
    //   (b-…-st) of the same kind.
    // why: only ← "in the area" heard with a "the only one" script; biggest ← b + a final -st, the same shape as best
    { id: 'd2', skill: 'detail', level: 'B1', point: 'center', seg: [66.5, 69.9],
      stem: 'How is the meditation center described when they arrive?',
      choices: ['The best one around', 'The only one around', 'The biggest one around'], a: 0,
      cue: '「This is the」のあと、最初の形容詞。',
      line: 'This is the *best* meditation center in the area.',
      said: '「ここがこの辺りで一番の瞑想センターだ」と紹介する。',
      mean: 'the best ～ in the area ＝ この辺りで一番。見た目との差が次の話につながる。',
      trap: 'best と biggest は最初と最後の音が近い。1音節で短いなら best。',
      use: 'This is the best pizza place in town.（ここが町一番のピザ屋）' },

    // why: agrees ← "Oh" heard as "oh yes, true"; new subject ← "Oh" plus a new noun (the strip mall)
    { id: 'm2', skill: 'marker', level: 'B2', point: 'actually', seg: [69.7, 78],
      stem: 'After “It doesn’t look like much”, what does the reply’s opening do?',
      choices: ['Pushes back on that impression', 'Agrees and adds one more point', 'Moves on to a different subject'],
      a: 0,
      cue: '返事の最初の2語と、そのあとの形容詞。',
      line: '*Oh, actually*, this strip mall has *surprisingly decent* chi.',
      said: '「大したことなさそう」に「実は、意外と気の流れがいい」と返す。',
      mean: 'actually ＝ 実は。相手の思い込みをやんわり打ち消す合図。',
      trap: 'Oh を「ああ、そうだね」と取ると同意に聞こえる。actually のあとは反対の話が多い。',
      use: 'Actually, it’s better than it looks.（実は、見た目よりいいんだよ）' },

    // why: up front ← "behind me" heard, the place flipped; wait outside ← Ron's refusal heard as leaving
    { id: 'd4', skill: 'detail', level: 'B1', point: 'stand', seg: [96.5, 104.5],
      stem: 'When Chris asks Ron to sit behind him, what does Ron say?',
      choices: ['That he will stand instead', 'That he will sit up front', 'That he will wait outside'], a: 0,
      cue: '「sit behind me」のあと、ロンの短い一言。',
      line: 'quietly, sit behind me and let’s join breath. — *I’ll stand.*',
      said: '「静かに後ろに座って、呼吸を合わせよう」に、ロンは「立ってる」とだけ返す。',
      mean: '座るのも断る。最小限しか付き合わないロンらしい一言。',
      trap: '断りの一言は短く、聞き逃しやすい。直前の sit と対になる動作を表す語を探す。',
      use: 'No thanks, I’ll stand.（いえ、立ったままで結構です）' },

    // why: an hour ← Chris called it "a quick session"; sixteen ← six/sixteen; a whole day ← "spend a day" earlier
    { id: 'n1', skill: 'number', level: 'B1', point: 'hours', seg: [114.9, 118.6], keep: true,
      stem: 'In all, how long were they in there?',
      choices: ['About an hour', 'About six hours', 'About sixteen hours', 'A whole day'], a: 1,
      cue: '「All told」のあと、数字のあとの音。',
      line: 'All told, we were in there about *six hours*.',
      said: '「全部で、中に6時間ほどいた」とカメラに話す。',
      mean: 'all told ＝ 全部で。「さっと一回」のはずが6時間になった。',
      trap: 'six と sixteen は語尾の「ティーン」で区別する。teen は長く強く聞こえる。',
      use: 'All told, it took about two hours.（全部で2時間くらいかかった）' },

    // R fix: V2 (blind 60 %): the key was the only "clever" reading. All three are now "says X, then Y"
    //   contradictions; only the key's halves are both in the audio.
    // why: dozed ← "mind was blank" + six hours read as dozing off; hard work ← "quietly breathing" heard as
    //   effort, and "no matter how hard I try" comes soon after
    { id: 'h2', skill: 'humor', level: 'C1', point: 'blank', seg: [118.6, 127.5],
      stem: 'Why is Ron’s account of what he did in there funny?',
      choices: ['He says he didn’t meditate, then describes meditating', 'He says he wasn’t bored, then admits he dozed off',
                'He says he didn’t try, then admits it was hard work'], a: 0,
      cue: 'カメラへの「no」のあと、何をしていたか。',
      line: 'no, I was *not meditating*. I just stood there, *quietly breathing*… My *mind was blank*.',
      said: '「瞑想はしてない。静かに息をして立っていただけ。頭は空っぽ」と話す。',
      mean: '否定しながら、言っている中身は瞑想の目標そのもの。本人だけが気づいていない。',
      trap: 'mind was blank を「寝ていた」と取りやすい。否定した語と、あとの中身を比べる。',
      use: 'I just sat there and breathed.（ただ座って息をしてた）' },

    // C2: the talking head against the scene (cf. h2)
    // anchor: 118.8–127.1 s to camera: "I was not meditating. I just stood there, quietly breathing… My mind was blank";
    //   133.6–136.0 s "What were you thinking about? — I wasn't thinking at all"; 136.6–142.2 s "It takes a ton of work
    //   for me to get to that kind of a clear headspace"
    // why: joke ← sincerity flip: praise this big for doing nothing sounds like teasing; faked ← "I was not meditating"
    //   heard as a confession that he only put on a calm face
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'blank', reveals: ['impressed', 'nottry'], seg: [118.6, 142.6],
      stem: 'After Ron’s comment to the camera, how should we hear Chris’s praise?',
      choices: ['As true: Ron got there by not trying', 'As a joke about Ron doing nothing',
                'As a mistake: Ron just faked being calm'], a: 0,
      cue: 'カメラへの話と、そのあとの二人の会話を比べて。',
      line: 'I just stood there, quietly breathing… — Ron, you *radiated mindfulness*.',
      said: 'カメラに「瞑想せず、ただ立って息をしていた」と話し、クリスには「心が澄みきっていた」とほめられる。',
      mean: 'カメラへの一言が場面を書きかえる。ロンの「無の状態」は瞑想の到達点で、ほめ言葉は的中している。',
      trap: '何もしないでほめられると、皮肉か勘違いに聞こえる。本人の説明とほめ言葉を突き合わせる。',
      use: 'You’re a natural at this.（君、これの才能あるよ）' },

    // R fix: V2 + K6 (blind 60 %): the key was the only negative choice. "Annoyed by their noise" is a second
    //   negative reading of "what the hell", refuted by "crackpots" (what he thinks of them, not of a sound).
    // why: noise ← "what the hell" heard as irritation at something they do; wonders ← "I don't know what… are doing"
    //   taken as a real question
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'crackpots', seg: [127.4, 130.7],
      stem: 'How does Ron feel about the other people in the room?',
      choices: ['He thinks they’re all a bit nuts', 'He’s annoyed they’re making noise', 'He wonders how they do it so well'],
      a: 0,
      cue: '文の最後、ほかの人たちを何と呼ぶか。',
      line: 'I don’t know what the hell these other *crackpots* are doing.',
      said: '「ほかの変人どもが何をしてるのか、さっぱり分からん」と言う。',
      mean: 'crackpot ＝ 変わり者。the hell が付いて、見下した言い方になる。',
      trap: 'I don’t know what ～ を素直な疑問と取りやすい。最後の呼び名が気持ちを決める。',
      use: 'I have no idea what they’re doing.（あの人たちが何してるか全然分からない）' },

    // R fix: V2 (blind 55 %): the key was the only warm choice. "Polite, but not truly impressed" is a warm near miss
    //   (お世辞), refuted by "Incredible" and his own "a ton of work for me".
    // why: teasing ← "radiated mindfulness" sounds overblown, like a joke; polite ← praise heard as お世辞
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'impressed', seg: [130.6, 142.6],
      stem: 'How does Chris react to how Ron did?',
      choices: ['He is deeply impressed', 'He is quietly teasing Ron', 'He is polite, but not impressed'], a: 0,
      cue: '「I wasn’t thinking」のあとの一語と、自分の話。',
      line: 'Ron, you *radiated mindfulness*… *Incredible.* It takes a ton of work for me…',
      said: '「マインドフルネスがあふれ出てた」とほめ、「信じられない。僕は頑張っても無理」と言う。',
      mean: '自分と比べてほめている。からかいではなく、本気で感心している。',
      trap: '大げさなほめ言葉は皮肉に聞こえることもある。自分の苦労話が続けば本気のほめ言葉。',
      use: 'Incredible. How do you do it?（すごい。どうやってるの？）' },

    // R fix: V2 + K5 (blind 55 %): the key was the only two-part "X, though Y". All three are now "outcome, reason".
    // why: meditated well ← Chris's "you radiated mindfulness" read as the reason; turned down ← broken script:
    //   admitting you hated the boss's activity costs you the job
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['flex'], seg: [130.6, 177.3],
      stem: 'How does the meditation test end for Ron?',
      choices: ['He’s hired, though he got nothing from it', 'He’s hired, mainly for meditating so well',
                'He’s turned down for admitting he hated it'], a: 0,
      cue: '最後の「Ron,」のあとと、その前の理由。',
      line: 'I got *nothing out of* that experience… — Ron, *you’ve got the job*.',
      said: '「何も得られなかった」と打ち明けるが、クリスは気にせず「採用だ」と告げる。',
      mean: '瞑想がうまかったからではない。楽しめなくても付き合ったことが評価された。',
      trap: '「マインドフルネスがあふれていた」とほめられたので、瞑想の腕で選ばれたように思える。',
      use: 'Congratulations, you got the job!（おめでとう、採用だよ）' },

    // R fix: V2 (blind 70 %): "teach the class" assumed a class the audio never names and was the weakest. Now the
    //   literal take (he simply stops trying), which misses the try/not-trying clash.
    // why: stop ← "not-trying" heard alone, as plain obedience; make Ron try ← "try your… method" heard as Ron being
    //   made to try Chris's method
    { id: 'h3', skill: 'humor', level: 'C1', point: 'nottry', seg: [142.6, 151.95],
      stem: 'After Ron’s short advice, what makes Chris’s plan funny?',
      choices: ['He’s going to try hard at not trying', 'He’s going to stop trying, as Ron said',
                'He’s going to make Ron try his method'], a: 0,
      cue: '「I’m going to」のあと、同じ語が2回。',
      line: 'Don’t try so hard. … I’m going to *try your not-trying method*',
      said: '「頑張りすぎるな」と言われ、「君の『頑張らない方法』をここで試してみる」と言う。',
      mean: '頑張らない方法を、さっそく頑張って試す。try が2回出る矛盾が笑い。',
      trap: 'your と method だけ拾うと、誰がするかが入れかわる。同じ語が並べば矛盾を疑う。',
      use: 'Don’t try so hard. Just relax.（頑張りすぎないで。肩の力を抜いて）' },

    // why: tidy up ← "clean" taken literally (掃除); leave ← "Chris, wait" heard as Ron about to walk out
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'clean', seg: [151.95, 160.35],
      stem: 'When Ron stops Chris, what does he say he should do?',
      choices: ['Tell Chris the honest truth', 'Clean up after the session', 'Leave before Chris begins'], a: 0,
      cue: '「so I should」のあとの2語。',
      line: 'I know this crap is important to you, so I should *come clean*.',
      said: '「これが君には大事なのは分かってる。だから正直に言う」と切り出す。',
      mean: 'come clean ＝ 隠していたことを打ち明ける。言いにくい本音の前置き。',
      trap: 'clean を「掃除」と取ると話が合わない。come clean は「白状する」の決まり文句。',
      use: 'Okay, I have to come clean.（よし、正直に言うね）' },

    // C2: what he is trying not to say
    // anchor: 160.5–162.1 s "So if you're looking for someone who enjoys meditation…" stops unfinished; 162.7–168.6 s
    //   Chris answers that worry: "I didn't expect you to enjoy it. My one reservation about you as a co-worker…"
    // R fix: V2 (blind 50 %): "give up meditation too" was off-topic for a job talk. Now "the center was a poor
    //   choice", a keyword trap from the strip mall; Chris's reply about Ron "as a co-worker" refutes it.
    // why: center ← "got nothing out of that experience" heard as blaming the place; another day ← the unfinished
    //   "if" heard as an offer to try again
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'trail', seg: [153.8, 168.8],
      stem: 'When Ron breaks off after “someone who enjoys meditation”, what goes unsaid?',
      choices: ['That Chris may want to hire someone else', 'That this center was a poor choice',
                'That he’d be willing to try another day'], a: 0,
      cue: '途中で止まった文と、クリスの返事の中身。',
      line: 'So if you’re looking for someone who *enjoys meditation*… — Oh, I didn’t expect you to enjoy it.',
      said: '「瞑想好きの人を探しているなら…」と言いかけ、クリスが「楽しむとは思ってない」と返す。',
      mean: '言わずに止めたのは「ほかの候補を選んだほうがいい」。クリスの返事が、仕事の話だったと答え合わせしている。',
      trap: 'if で止まると、申し出や提案に聞こえやすい。言いかけた文は、相手の返事から逆に読む。',
      use: 'If you want someone with more experience…（もっと経験のある人がいいなら…）' },

    // why: dislikes Chris ← "you and I… often at odds" earlier; hates the job ← Ron's opening "the position should
    //   not exist"
    { id: 'd3', skill: 'detail', level: 'B1', point: 'flex', seg: [162.3, 168.8],
      stem: 'What was Chris’s one worry about Ron as a co-worker?',
      choices: ['That he seemed unable to bend', 'That he seemed to dislike Chris', 'That he seemed to hate the job'],
      a: 0,
      cue: '「My one reservation」のあと、最後の形容詞。',
      line: 'My one reservation about you as a co-worker was that you seem *inflexible*.',
      said: '「同僚として唯一気がかりだったのは、君が融通が利かなそうなこと」と言う。',
      mean: 'inflexible ＝ 融通が利かない、考えを曲げない。',
      trap: 'reservation を「予約」と取ると話が見えない。one reservation は「ただ一つの不安」。',
      use: 'My only reservation is the price.（気になるのは値段だけ）' },

    // why: honesty ← he "came clean" just before, so honesty seems to be what won; clear mind ← Chris's "radiated
    //   mindfulness" praise
    { id: 'i3', skill: 'infer', level: 'C1', point: 'flex', seg: [162.3, 177.2],
      stem: 'What did the day actually test, in Chris’s view?',
      choices: ['Whether Ron would go along with it at all', 'Whether Ron would be honest about how it went',
                'Whether Ron could clear his mind like Chris'], a: 0,
      cue: '「merely by」のあとと、最後の一語。',
      line: '*merely by agreeing* to an activity you’re not interested in, you showed *flexibility*.',
      said: '「興味のないことに付き合うと決めただけで、柔軟さを示した」と言う。',
      mean: '楽しめたかどうかは関係ない。嫌でも付き合うかを見るための一日だった。',
      trap: '直前に正直に打ち明けたので、正直さが決め手に思える。理由は merely by のあとに来る。',
      use: 'Thanks for being such a good sport.（嫌な顔せず付き合ってくれてありがとう）' },
  ]
};
