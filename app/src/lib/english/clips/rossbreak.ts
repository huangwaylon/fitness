// REVIEW 2026-11-16: pass 8, fix 14, drop 1, new 0; ear checks 2
// REVIEW open: d4 and g1 stay guessable for anyone who knows the show's "we were on a break" (world knowledge, not
//   the choices); retire d4 if that reads as backstory
// “Rachel Confronts Ross About His One Night Stand | Friends” (the official Friends channel, Best of Season 3): Rachel
// learns Ross slept with someone the night of their fight; he argues they had broken up, she won't have it, and the
// friends hiding in the next room listen in and end up afraid to come out.
// Segments from the captions, words from whisper (2026-11-16). The captions drop 33.7–37 s, 43–73 s (the “how was
// she” exchange) and 152–159 s; no item uses those stretches or the “had sex” lines (11–16 s, 31–33 s). The sources
// differ at 29.9 s (“about this” / “about nothing”) and 133.6 s (“could” / “what could”); no key rests on those words.
// No item keys on who says “We were on a break” (131.2 s).
// EAR CHECK: 169 s a3 c1 — Rachel's “Oh, that is so sweet…” is taken as sarcastic (the words: his effort was to keep
//   it from her); the key holds on the words, the ear confirms the tone
// EAR CHECK: 193.3 s h4 — both sources have “wax the door shut, we're never leaving” (captions add “up”); the key
//   rests on “we” being the friends in the room
import type { Clip } from '../types.ts';

export const rossBreak: Clip = {
  id: 'rossbreak', video: 'GHTQQHwKa7Q', title: 'Rachel Confronts Ross About His One Night Stand', dur: 207, wpm: 142,
  band: 'slow', tags: ['恋愛', '友だち'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // why: grieved a little ← the nails heard as a sign of stress after the news; cares more ← the nails line heard
    //   as her changing the subject to herself
    { id: 'h1', skill: 'humor', level: 'C1', point: 'nails', seg: [18.4, 24.2],
      stem: 'Why does the friend’s reason for sensing trouble get a laugh?',
      choices: ['She offers her nails as proof she sensed it', 'She says the stress stopped her nails growing',
                'She cares more about her nails than the news'], a: 0,
      cue: '「because」のあとに続く理由の中身。',
      line: 'I *knew* something had to be wrong *because my fingernails did not grow* at all yesterday.',
      said: '「何かおかしいと思ってた。昨日、爪がまったく伸びなかったから」と言う。',
      mean: '爪が伸びないことを「予感の証拠」にしている。ありえない根拠を本気で出すのが笑い。',
      trap: '昨日の話なので、知らせのせいで爪が止まったわけではない。because のあとは理由。',
      use: 'I knew it! I just had a feeling.（やっぱり！そんな気がしてた）' },

    // R fix: V2/K6, the key was the overlap of the two distractors (fight + drunk); "had a drink … got in a fight"
    //   (a near sound on "had a fight") replaces "got dumped"
    // why: got drunk first ← the two events heard in the wrong order; had a drink ← "had a fight" half heard, the
    //   fight then pinned on Ross
    { id: 'd1', skill: 'detail', level: 'B1', point: 'drunk', seg: [23.2, 29.1],
      stem: 'How does one friend explain what happened to Ross that night?',
      choices: ['They had a fight, and he got drunk', 'He got drunk, and they had a fight',
                'They had a drink, and he got in a fight'], a: 0,
      cue: '「I guess」のあと、and でつながる二つの出来事。',
      line: 'I guess *they had a fight and he got drunk*.',
      said: '「たぶん二人がけんかして、彼が酔っぱらったんだろう」と説明する。',
      mean: 'けんかが先、そのあと酔った。and は起きた順に並べている。',
      trap: 'had a fight と had a drink は出だしが同じ。and の前後を、順番どおりに聞く。',
      use: 'We had a fight and he left.（けんかして、彼は出ていった）' },

    // R fix: V2, the key was the only "stay" (blind 60 %); "stay until she calms down" replaces "call her later"
    // why: give her space ← the Japanese frame: told to leave, you leave and wait; calmed down ← "stay" heard, the
    //   "talk about this" lost
    { id: 'd2', skill: 'detail', level: 'B1', point: 'stay', seg: [33.4, 41.2],
      stem: 'When he’s told to leave, what does Ross want?',
      choices: ['To stay and talk it through', 'To go and give her some space', 'To stay until she has calmed down'],
      a: 0,
      cue: '「No, I know」のあとの want to が二回。',
      line: 'No, I know. I *want to stay*. I *want to talk about this*.',
      said: '「出ていって」と言われ、「分かってる。でもここにいたい。話がしたい」と返す。',
      mean: 'I know は「言いたいことは分かる」。そのうえで帰らないと言っている。',
      trap: '日本語なら一度引く場面。I know のあとに、反対の希望が続いている。',
      use: 'I know, but I want to talk.（分かってる、でも話がしたい）' },

    // why: upset ← said just before "and then I got your message"; disgusted ← the first feeling he names
    { id: 'd3', skill: 'detail', level: 'B1', point: 'message', seg: [84.6, 97.7],
      stem: 'How did Ross feel when he got Rachel’s message?',
      choices: ['Upset', 'Happy', 'Disgusted'], a: 1,
      cue: '「your message」のすぐあと。',
      line: 'I was so upset, and then I got your message, and *I was so happy*',
      said: '「今朝は落ちこんでたけど、君のメッセージでうれしくなった」と話す。',
      mean: '気持ちが順に変わっていく。メッセージを受けた時点の気持ちは happy。',
      trap: '三つとも言っている語。and then のあとが、メッセージを受けたあとの気持ち。',
      use: 'Your text made my day.（君のメッセージで元気が出た）' },

    // dict: "get her out of" runs together; "her" loses its h (ゲラウトブ)
    { id: 'x1', skill: 'dict', level: 'B2', point: 'getout', seg: [93.5, 97.7],
      stem: 'Type it: “All I wanted was to ___ my apartment.” (4 words)',
      answer: 'get her out of',
      cue: '「wanted was to」のすぐあと。',
      line: 'all I wanted was to *get her out of* my apartment as fast as possible',
      said: '「とにかく彼女を部屋から早く出したかった」と言う。',
      mean: 'get 人 out of 場所 ＝ 人を外に出す。her の h が落ちてつながる。',
      trap: 'her の h が消えて get‿er‿out‿of がひと続き。「ゲラウロブ」のように聞こえる。',
      use: 'Let’s get you out of the rain.（雨に濡れないところへ行こう）' },

    // R fix: V2 (blind 65 %) + S4 (17.1 s); the distractors are now as dramatic as the key, and the segment starts at
    //   the time question
    // why: passed her ← "as fast as possible" heard as her leaving just as Rachel came; before the message ← the
    //   order of "got your message" and "get her out" lost
    { id: 'i1', skill: 'infer', level: 'B2', point: 'there', seg: [101.0, 114.3],
      stem: 'What does Rachel work out from Ross’s story?',
      choices: ['The woman was still there when she came by', 'The woman passed her on the way out',
                'The woman had left before her message came'], a: 0,
      cue: '時間をたずねたあと、「in there」が二回。',
      line: 'What time did your little friend leave? … She was *in there when I was in there*.',
      said: '帰った時間を聞き、「私がいたとき、あの人もいたのね」と気づく。',
      mean: '今朝 Rachel が来たとき、女性はまだ部屋にいた。それに気づいた。',
      trap: 'as fast as possible から「もう帰っていた」と思いやすい。when が時を重ねる。',
      use: 'Wait, you were there when I was there?（待って、私がいたときにいたの？）' },

    // why: admit the worst ← "the important thing" heard as owning up to the main point; their future ← a cut-in
    //   heard as a change of topic to what comes next
    // R fix: S1/N7, the stem stated i1's key ("realizes the woman was there"); it now names the moment
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'important', seg: [110.8, 122.3],
      stem: 'When Ross cuts in with “Hey, hey…”, what is he trying to do?',
      choices: ['Move the talk to something better for him', 'Own up to the worst part before she does',
                'Change the subject to what happens next'], a: 0,
      cue: '「hey, hey」のあとに出す話題。',
      line: 'Hey, hey, *the important thing is* she meant nothing to me.',
      said: '「待って、大事なのは、彼女は何でもなかったってことだ」と割って入る。',
      mean: 'the important thing is で、自分に有利な点へ話を移そうとしている。',
      trap: '「大事なこと」は告白の前置きに聞こえやすいが、続くのは言い訳。',
      use: 'The important thing is, nobody got hurt.（大事なのは、誰もけがしなかったこと）' },

    // R fix: V2 (blind 85 %, the famous "break" in the key) + S3 (cue held "break", a key-only word); asked from the
    //   angle of why they can't agree, with "meant nothing" as the near miss
    // why: drunk ← "got drunk" said earlier as an excuse; the woman ← "she meant nothing to me" and Rachel's reply
    //   heard as the dispute
    { id: 'g1', skill: 'gist', level: 'B2', point: 'fight', reveals: ['brokenup'], seg: [118.5, 146.3],
      stem: 'Why can’t they agree on whether Ross cheated?',
      choices: ['They disagree on whether they were still a couple', 'They disagree on whether the woman meant anything',
                'They disagree on whether he was too drunk to know'], a: 0,
      cue: '二人が何度もくり返す、relationship のあたり。',
      said: '彼は「別れたと思った」、彼女は「ただの休みだった」とぶつかる。',
      mean: '争点は「休み」が「別れ」に入るかどうか。浮気かどうかはそこで決まる。',
      trap: 'meant nothing は言い訳で、争点ではない。I thought のあとと、その返しを聞く。',
      use: 'It depends on what you mean by “over”.（「終わり」の意味によるね）' },

    // R fix: V2 (blind 55 %), the key was the only adversarial choice and the only idiom; all three are now
    //   "Each one…", with "less sure she is right" (his reasons heard as landing) replacing "asks about the woman"
    // why: calms her ← the apologies ("I'm sorry", "meant nothing") heard as working; less sure ← "I thought we were
    //   broken up" heard as a fair point that shakes her
    { id: 'g2', skill: 'gist', level: 'B2', point: 'worse', seg: [118.5, 176.2],
      stem: 'How do Ross’s explanations land with Rachel as the fight goes on?',
      choices: ['Each one hands her a new point to use against him', 'Each one calms her down a bit more than the last',
                'Each one makes her a little less sure she is right'], a: 0,
      cue: '彼が理由を言うたび、彼女の返事の最初の言葉。',
      said: '理由を言うたびに、彼女は言い返していく。',
      mean: '言い訳が一つずつ、新しい責める材料に変わる。話すほど悪くなる場面。',
      trap: 'I’m sorry が出るので収まりそうに聞こえる。返事の and yet や Well で、向きを確かめる。',
      use: 'You’re only making it worse.（言うほど悪くなってるよ）' },

    // R fix: V2 (blind 60 %), the key was the only adversarial choice; "agrees, if a bit doubtfully" (and yet read as
    //   それでも) replaces "softens what she said before"
    // why: adds ← "and" heard as plain addition (そして); agrees doubtfully ← the Japanese frame: and yet = それでも,
    //   a grudging yes
    { id: 'm1', skill: 'marker', level: 'B2', point: 'andyet', reveals: ['jeopardize'], seg: [118.9, 125.8],
      stem: 'When Ross says the woman meant nothing, what do Rachel’s first two words set up?',
      choices: ['A point that turns his own words against him', 'A point that adds to what he has just said',
                'A point that agrees with him, if a bit doubtfully'], a: 0,
      cue: '答えの最初の二語。',
      line: 'she meant nothing to me — *And yet* she was worth jeopardizing our relationship.',
      said: '「何でもなかった」に「なのに関係を危うくする価値はあったのね」と返す。',
      mean: 'and yet ＝ それなのに。相手の言葉を逆手に取って、矛盾を突いている。',
      trap: 'and を「そして」と取ると付け足しに聞こえる。and yet は but より強い逆接。',
      use: 'It’s cheap, and yet it works great.（安いのに、すごく使える）' },

    // R fix: V2 (blind 55 %), "a secret" was off-pattern; "put it behind him" (jeopardize heard as giving it up)
    //   makes three "Put their relationship…" choices
    // why: on hold ← "break" in the air, a pause read into the verb; behind him ← jeopardize taken as ending it, not
    //   risking it
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'jeopardize', seg: [118.9, 125.8],
      stem: 'What does Rachel say Ross was willing to do for this woman?',
      choices: ['Put their relationship at risk', 'Put their relationship on hold', 'Put their relationship behind him'],
      a: 0,
      cue: '「worth」のあとの長い動詞。',
      line: 'she was worth *jeopardizing* our relationship',
      said: '「その人は、二人の関係を危うくするだけの価値があったのね」と言う。',
      mean: 'jeopardize ＝ 危険にさらす。be worth -ing の形で皮肉っている。',
      trap: '別れの話なので「保留」と取りやすい。jeopardize は「危うくする」。',
      use: 'I don’t want to jeopardize my job.（仕事を危うくしたくない）' },

    // R fix: V2 (blind 80 %), "seeing someone" was a filler; "just taking a break" (Rachel's side, said a second
    //   later outside the segment) replaces it
    // why: make up soon ← "a break" heard as a short pause; taking a break ← the other speaker's view, and broken up's
    //   weak p heard as break
    { id: 'd4', skill: 'detail', level: 'B1', point: 'brokenup', seg: [126.1, 131.15],
      stem: 'What did Ross believe about the two of them that night?',
      choices: ['That they had broken up', 'That they would make up soon', 'That they were just taking a break'], a: 0,
      cue: '「I thought」のあとの二語の動詞。',
      line: 'I didn’t think there was a relationship to jeopardize. *I thought we were broken up*.',
      said: '「危うくする関係なんてないと思ってた。別れたと思ってたんだ」と言う。',
      mean: 'break up ＝ 別れる。自分は浮気をしたつもりはない、という言い分。',
      trap: 'broken up の p が弱く、break（休み）と混ざりやすい。were のあとの形を聞く。',
      use: 'I thought we were done.（もう終わったと思ってた）' },

    // why: changing the subject ← "get out of this" heard as dodging the talk; blaming friends ← the friends come up
    //   at the end (Chandler and Joey)
    // R fix: N4, the trap named the mechanism but gave no habit for next time
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'technical', seg: [133.9, 140.7],
      stem: 'What does Rachel accuse Ross of trying to do?',
      choices: ['Escape blame on a small point of wording', 'Escape blame by changing the subject',
                'Escape blame by blaming his friends'], a: 0,
      cue: '「get out of this」のあと、on で始まる言い方。',
      line: 'You think you’re gonna *get out of this on a technicality*?',
      said: '「細かい言葉で逃げきれると思ってるの？」と言う。',
      mean: 'on a technicality ＝ 細かい言葉の上で。「別れ」の定義で逃げるな、ということ。',
      trap: 'technical から「技術的」と取りやすい。on のあとは盾にするもの。',
      use: 'He won on a technicality.（細かいルールのおかげで勝った）' },

    // R fix: V2 (blind 65 %), "laughs it off" was a filler; "denies it and blames her" (same stance, one wrong part)
    //   replaces it
    // why: apologetic ← "I'm not trying…" heard as backing down; blames her ← "okay?" heard as a counterattack on her
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'dead', seg: [135.6, 142.65],
      stem: 'How does Ross answer Rachel’s charge?',
      choices: ['Defensively: he denies it and repeats his view', 'Apologetically: he admits it was a weak excuse',
                'Defensively: he denies it and blames her for it'], a: 0,
      cue: '否定の文のあと、okay? に続く文。',
      line: 'I’m *not trying to get out of anything*, okay? *I thought our relationship was dead*.',
      said: '「逃げようなんてしてない、いい？関係は終わったと思ってたんだ」と言う。',
      mean: '否定したうえで、同じ言い分をもう一度強く言っている。守りの姿勢。',
      trap: 'not trying を「そんなつもりは…」という謝りと取りやすい。あとで言い分をくり返している。',
      use: 'I’m not making excuses, okay?（言い訳してるんじゃないよ、いい？）' },

    // R fix: V2 (blind 70 %) + S2/S3 (the stem quoted "the wake", the cue's "dead" was a key-only word); the key no
    //   longer explains the joke at length, and "he killed it himself" (dead → who killed it) replaces "grieved"
    // why: killed it ← "dead" taken as an accusation of who ended it; not awake ← wake = 目を覚ます
    { id: 'h2', skill: 'humor', level: 'C1', point: 'wake', seg: [140.3, 146.3],
      stem: 'Why does Rachel’s comeback to Ross’s last excuse hit so hard?',
      choices: ['She turns his own word into a funeral he enjoyed',
                'She says he is the one who killed the relationship',
                'She says he wasn’t even awake to what he did'], a: 0,
      cue: '直前の「dead」と、その返し。',
      line: 'I thought our relationship was *dead*. — Well, you sure had *a hell of a time at the wake*.',
      said: '「死んだと思ってた」に「そのお通夜でずいぶん楽しんだのね」と返す。',
      mean: 'wake ＝ お通夜。相手の「死んだ」を借りて、悲しむどころか遊んでいたと突いている。',
      trap: 'wake を「目が覚める」と取ると意味が通らない。直前の dead とつながる語を探す。',
      use: 'You sure had fun at the party.（パーティー、ずいぶん楽しんだね）' },

    // R fix: K4/§9.5, "Why'd ___ have to" leaves no subject (not a real option); S4, the segment was 2.9 s
    // why: I ← the d of "I'd" swallowed by "have"; I'll ← a future "I'll have to" pattern
    { id: 's1', skill: 'sound', level: 'B2', point: 'gunther', seg: [158.9, 162.1],
      stem: 'Fill the gap: “___ have to hear about it from Gunther?”',
      choices: ['I', 'I’d', 'I’ll'], a: 1,
      cue: '文の最初、とても短い音。',
      line: '*I’d* have to hear about it from Gunther?',
      said: '「ガンターから聞かされるなんて」と言う。',
      mean: 'I’d have to ＝ そんな目にあうなんて。ほかの人から知らされたことへの怒り。',
      trap: 'I’d の d は次の have に吸われ、I だけに聞こえやすい。I’ll なら l の音が残る。',
      use: 'I had to hear it from my sister?（妹から聞かされるなんて）' },

    // why: wanted him to tell ← "like I wanted him to tell you" taken literally (like ＝ as if lost); find Rachel ←
    //   "ran all over the place" heard as looking for her
    { id: 'i2', skill: 'infer', level: 'B2', point: 'tried', seg: [161.7, 167.2],
      stem: 'What does Ross say he had been trying to do?',
      choices: ['Keep Gunther from telling her', 'Get Gunther to tell her for him', 'Find her and tell her himself'], a: 0,
      cue: '「Come on」のあとの like と、最後の文。',
      line: 'Come on, *like I wanted him to tell you*. I ran all over the place trying to *make sure that didn’t happen*.',
      said: '「彼に話してほしかったわけないだろ。そうならないように走り回ったんだ」と言う。',
      mean: 'like ＋文 ＝「まるで…みたいに」。「そんなはずない」という反語になる。',
      trap: 'like を飛ばすと「話してほしかった」と逆になる。文頭の like は否定の合図。',
      use: 'Like I would ever forget your birthday!（君の誕生日を忘れるわけないだろ！）' },

    // anchor: 162.24–163.74 s "come on" then "like I wanted him to tell you", 4 weak words in under a second (both
    //   sources have "like"); a sarcastic "like" (= as if) that grammar would turn into "I'd like"
    { id: 'c2', skill: 'dict', level: 'C2', point: 'tried', seg: [161.7, 166.6],
      stem: 'Type it: “Come on, ___ to tell you.” (4 words)', answer: 'like i wanted him',
      cue: '「Come on」のすぐあと。文法より、聞こえた音を。',
      line: 'Come on, *like I wanted him* to tell you.',
      said: '「話してほしかったわけないだろ」と言う。4語が速く、wanted him がつながる。',
      mean: '文頭の like は「まるで…みたい」という反語。I’d like と聞くと意味が逆になる。',
      trap: 'like を I’d like と取って語を変えたくなる。書き取りは聞こえた語を順に書く。',
      use: 'Like I have time for that.（そんな暇あるわけないでしょ）' },

    // why: wanting to tell her himself ← he says it a moment later ("I wanted to tell you"); getting her out fast ←
    //   "as fast as possible" was also said to sound good
    // anchor: 163.86–166.26 s "I ran all over the place trying to make sure that didn't happen" (that = Gunther telling
    //   her), then at once "Oh, that is so sweet": the praise has only that effort to point at
    { id: 'c1', skill: 'pragma', level: 'C2', point: 'sweet', seg: [161.7, 176.2],
      stem: 'Taken as sincere, what would Rachel be thanking Ross for?',
      choices: ['Working hard to keep the truth from her', 'Wanting to tell her the truth himself',
                'Getting the woman out as fast as he could'], a: 0,
      cue: '「so sweet」の直前の一文が、何の話か。',
      line: 'I ran all over the place trying to make sure that didn’t happen. — Oh, that is *so sweet*.',
      said: '「ガンターが話さないよう走り回った」に、「なんて優しいの」と返す。',
      mean: '本気なら「隠してくれてありがとう」になる。ありえないお礼を言うことで、隠そうとしたこと自体を責めている。',
      trap: '話したかった件はこのあとで、ここでは出ていない。皮肉は、ほめた中身を本気にしたら何になるかで読む。',
      use: 'Thanks for keeping me in the loop.（ずっと教えてくれてありがとう、ね）' },

    // R fix: V2 (blind 80 %), "softly forgiving" was a filler; "bitterly: he only tried once caught" (right tone,
    //   wrong target) replaces it
    // why: sincerely moved ← "so sweet" and "falling in love" at face value; once caught ← bitter heard right, but the
    //   effort placed after the news was out, not before
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'sweet', seg: [163.5, 176.2],
      stem: 'How does Rachel mean her reply to Ross running all over the place?',
      choices: ['Bitterly: all that effort went into hiding it', 'Warmly: she is moved that he tried so hard',
                'Bitterly: he only tried once he was caught'], a: 0,
      cue: '直前に彼が何のために走り回ったか。',
      line: 'Oh, that is *so sweet*. I think I’m *falling in love with you all over again*.',
      said: '隠そうと走り回った話に、「なんて優しいの。また恋に落ちそう」と返す。',
      mean: 'ほめているのは「隠すための努力」。だから皮肉。怒りは少しも引いていない。',
      trap: 'sweet や love を字どおりに取りやすい。何に対してほめているかを、直前の話で確かめる。',
      use: 'Oh, great. That’s just perfect.（あら、最高ね。言うことなし）' },

    // R drop: i3 (V2 blind 55 % + K1): the real reason ("they'll know we've been listening", 152 s) is in whisper only,
    //   and "more important things to worry about" fits both "not be noticed" and any near miss (blame, getting
    //   pulled in), so no fix leaves one best answer
    // why: Rachel won't let him go ← "never leaving" heard about Ross; lock Ross in ← "door shut" heard as a plan
    //   against him
    { id: 'h4', skill: 'humor', level: 'C1', point: 'never', reveals: ['convinced'], seg: [182.3, 196.2],
      stem: 'Why does the line about shutting the door get a laugh?',
      choices: ['Ross has just named two of them, so they will hide', 'Rachel will now never let Ross leave the room',
                'They plan to keep Ross in until he says sorry'], a: 0,
      cue: '直前に出た名前と、「we」が誰か。',
      line: 'Chandler and Joey convinced me not to. … *We’re never leaving*.',
      said: 'ロスが二人の名前を出すと、隣の部屋で「もう出ない」と言う。',
      mean: '名前が出た二人は、もう Rachel の前に出られない。さっきの「出ていける」が逆転する。',
      trap: 'never leaving を Ross の話と取りやすい。we は隣の部屋の友だち。',
      use: 'That’s it. I’m never leaving this room.（もうだめ。この部屋から一生出ない）' },

    // dict: "convinced me not to" — "me" and "not to" are weak and short
    { id: 'x2', skill: 'dict', level: 'B1', point: 'convinced', seg: [185.2, 189.5],
      stem: 'Type it: “And then Chandler and Joey ___.” (4 words)', answer: 'convinced me not to',
      cue: '二人の名前のすぐあと、文の終わりまで。',
      line: 'I did, and then Chandler and Joey *convinced me not to*.',
      said: '「言おうとしたけど、二人に止められた」と打ち明ける。',
      mean: 'convince 人 not to ＝ 説得してやめさせる。to のあとの tell が省かれている。',
      trap: 'me と not to が弱く、convinced‿me がつながる。',
      use: 'She talked me out of it.（彼女に説得されてやめた）' },
  ]
};
