// “Rachel Needs a Job | Friends” (the official Friends channel, Best of Season 3): Rachel asks her friends to help mail
// her resumes, snaps at Chandler's jokes and Ross's reassurance, decides to call Gunther and take back her notice, and
// Joey walks in with good news at the worst moment.
// Segments from the captions, words from whisper (2026-11-16). Untested: 4.0 s ("stamp lickers" / captions
// "Liquors"), 28.9–30.3 s (whisper "I don't know, I don't know" / captions "no"), 38.9 s ("Just really calm down" /
// "it best way to calm down"), 51.2 s ("Well, you, you, you" / "would you you").
// REVIEW 2026-11-16: pass 7, fix 13, drop 0, new 0; ear checks 3 (unchanged)
// Open: plays 3–4 in harder mode skip an unseen C2 for 2 of 40 seeds (same as before the review; nt1 and nt2 share
//   points with gunther/okay items).
// EAR CHECK: 30.4 s s1, 52.0–53.8 s x1 — both sources have "Weren't you the guy" and "give in to the fear"; confirm the
//   final t of "weren't" is weak but there, and that "give in to" runs together
// EAR CHECK: 40.7–42.5 s nt2 — the stress in "No, it's not gonna be okay" falls on "not" (ship only once confirmed)
// EAR CHECK: 62.85 s r1 h1 — the cut falls after Joey's "great news" and before "Run, Joey"; the shout is assumed to be
//   a friend's, not Rachel's
import type { Clip } from '../types.ts';

export const rachelJob: Clip = {
  id: 'racheljob', video: 'WCz7GlIY0dA', title: 'Rachel Needs a Job', dur: 76, wpm: 154, band: 'mid',
  tags: ['友だち', '職場'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: N7: the third choice said "tomorrow" (n1's key); it now ends "quitting it". Blind 55 %, but that came from
    //   the header; a fresh read is near 45 %
    // why: asking friends ← she opens by calling on "everybody" for help; quitting ← "my last day" heard as a new plan
    //   rather than the deadline she is up against
    { id: 'g1', skill: 'gist', level: 'B2', point: 'plan', reveals: ['gunther', 'help'], seg: [0, 51.45],
      stem: 'Over the scene, how does Rachel’s plan change?',
      choices: ['From mailing resumes to keeping her old job', 'From job hunting alone to asking friends for work',
                'From keeping her old job to quitting it'], a: 0,
      cue: '最初の頼みごとと、最後に決めたことを比べて。',
      line: 'I’m just gonna call Gunther, and I’m gonna *tell him I’m not quitting*.',
      said: '最初は履歴書の発送を手伝ってと頼み、最後は店長に「辞めない」と電話すると言い出す。',
      mean: '新しい仕事が見つからず、今の仕事にとどまる方向へ切りかえた。',
      trap: 'last day は追い詰められた事情で、新しい決心ではない。場面の最初と最後の動きを並べる。',
      use: 'I think I’ll stay put for now.（今はこのままでいようかな）' },

    // why: printing ← "on my computer" comes right after; calling ← she talks about calling Gunther later
    { id: 'd1', skill: 'detail', level: 'B1', point: 'help', seg: [0, 4.35],
      stem: 'When Rachel stops everybody, what kind of help does she want?',
      choices: ['Help mailing out her resumes', 'Help printing more resumes', 'Help calling places about jobs'], a: 0,
      cue: 'I need のあとに来る、人を表す語。',
      line: 'I need *envelope stuffers*, I need *stamp lickers*.',
      said: '「みんな手を止めて。ふうとうに詰める人と、切手をなめる人が要るの」と呼びかける。',
      mean: 'ふうとうと切手で、履歴書をたくさん郵送する手伝いを頼んでいる。',
      trap: 'stuffer や licker は耳慣れない語。-er は「〜する人」と分かれば、作業が見える。',
      use: 'I need a couple of volunteers.（手伝ってくれる人が2人ほしい）' },

    // R fix: V2 (blind 50 %): "thanks them" became a laugh-it-off reading of "that's funny"; N7: the line dropped
    //   "…okay, Ross", which gave away w1's key
    // why: laughs it off ← "Oh, hey, that's funny" taken at face value; calms down ← "calm down" and "it's gonna be
    //   okay" heard as advice she follows
    { id: 'g2', skill: 'gist', level: 'B2', point: 'mood', reveals: ['funny', 'hatefear'], seg: [4.35, 65.5],
      stem: 'What happens each time a friend comments on Rachel’s job hunt?',
      choices: ['She snaps back at whoever spoke', 'She laughs it off and moves on', 'She takes it in and calms down'], a: 0,
      cue: '友だちの一言のあと、毎回の返し方。',
      line: 'You’re funny, Chandler. … *You and your stupid fear.*',
      said: '字の大きさの冗談にも、「大丈夫」にも、「恐れ」の話にも、きつく言い返す。',
      mean: '追い詰められて、どんな言葉も攻撃に聞こえる。助言も冗談も跳ね返す。',
      trap: 'that’s funny を聞くと笑って流したように取れる。毎回、そのあとに相手を責める一言が続く。',
      use: 'Sorry, I’m just really on edge today.（ごめん、今日はピリピリしてて）' },

    // R fix: V2 (blind 75 %): "childish" filler replaced by a show-off reading
    // why: stand out ← a big font read as trying too hard, not as filling space; won't fit ← envelopes were just mentioned
    { id: 'i1', skill: 'infer', level: 'C1', point: 'font', seg: [4.35, 10.25],
      stem: 'When a friend says “you sure used a large font,” what is he hinting?',
      choices: ['She had little to put on them', 'She tried too hard to stand out', 'They won’t fit in the envelopes'], a: 0,
      cue: 'sure の使い方と、字が大きい理由。',
      line: 'Well, you *sure used a large font*.',
      said: '誰が作ったのか聞き、本人だと分かると「ずいぶん大きな字にしたね」と言う。',
      mean: '字を大きくして紙を埋めた、つまり書くことが少ない、という遠回しなからかい。',
      trap: '見た目の感想として聞きやすい。sure を付けたコメントは、裏の意味を探す合図。',
      use: 'Wow, you sure packed light.（ずいぶん身軽に来たね）' },

    // R fix: V2 (blind 55 %): the key was the only choice that matched the font joke; now a literal "so much = a lot"
    //   distractor, in the same frame
    // why: too much room ← "so much room" read as "a lot of room"; stand out ← a big font is how you make things stand out
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'font', reveals: ['help'], seg: [8.3, 17.6],
      stem: 'How does Rachel explain the size of the letters?',
      choices: ['Her two jobs didn’t take up much room', 'Her two jobs took up too much room',
                'She wanted her two jobs to stand out'], a: 0,
      cue: 'two つの仕事を挙げたあと、最後の部分。',
      line: 'waitress at a coffee house and cheer squad co-captain *only took up so much room*.',
      said: '「カフェのウェイトレスとチアの副キャプテンじゃ、そんなに場所を取らなくて」と答える。',
      mean: 'その程度しか紙を埋めない、という意味。経歴の少なさを自分で認めている。',
      trap: 'so much を「とても多く」と取ると逆。only と組むと「その程度しか」。',
      use: 'My bag only holds so much.（このバッグ、そんなに入らないの）' },

    // R fix: V2 (blind 70 %): "close to tears" was a filler; three "feeling, and…" choices, one an embarrassed laugh
    // why: amused ← "funny" said three times taken at face value; embarrassed ← "that's funny" heard as a laugh to
    //   cover the font joke; the jab that follows rules both out
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'funny', seg: [18.0, 32.8],
      stem: 'When Rachel answers the font joke, how does she really feel?',
      choices: ['Annoyed, and about to hit back', 'Amused, and glad he lightened things', 'Embarrassed, and laughing it off'], a: 0,
      cue: '同じほめ言葉のくり返しと、そのあとの質問。',
      line: 'Oh, hey, that’s funny. *You’re funny, Chandler. You’re a funny guy.*',
      said: '「面白いね。チャンドラーは面白い人だね」と何度も言い、すぐ彼の昔の助言を持ち出す。',
      mean: 'ほめ言葉を重ねるほど本気でない、という皮肉。すぐ反撃が来ることで分かる。',
      trap: 'funny を額面どおり取りやすい。同じほめ言葉が続いたら、次の一言で本心を確かめる。',
      use: 'Oh, great. That’s just perfect.（あーあ、最高だね）' },

    // R fix: V2 (blind 60 %): the key was the only specific choice; now a self-mocking joke and a topper
    // why: at her own expense ← after the font joke, joining in on herself; topping his joke ← "what else is really
    //   funny" heard as a funnier story coming
    { id: 'pr1', skill: 'pragma', level: 'C1', point: 'funny', reveals: ['quit'], seg: [22.95, 35.4],
      stem: 'What is Rachel setting up with “You know what else is really funny?”',
      choices: ['A dig at advice he once gave her', 'A joke at her own expense',
                'A funnier story to top his joke'], a: 0,
      cue: '問いかけのあと、No に続く質問の中身。',
      line: 'You know what else is really funny? … *Weren’t you the guy that told me to quit my job*',
      said: '「ほかに面白いこと知ってる？」と振り、「仕事を辞めろと言ったのはあなたよね」と続ける。',
      mean: '面白い話をする前置きの形で、相手を責める話を始める。皮肉の続き。',
      trap: '前置きの形どおりに冗談が来ると思いやすい。前置きのあとの中身で働きを決める。',
      use: 'You know what else would be great?（ほかに何があったら助かるか分かる？）' },

    // why: keep her job ← the opposite advice, the "safe" script; ask her boss ← Gunther comes up later in the scene
    { id: 'd2', skill: 'detail', level: 'B2', point: 'quit', seg: [29.3, 35.6],
      stem: 'What does Rachel say Chandler told her to do?',
      choices: ['Quit her job with nothing lined up', 'Keep her job until she found another',
                'Ask her boss for a better position'], a: 0,
      cue: 'told me to のあとと、when に続く部分。',
      line: 'told me to *quit my job* when I had *absolutely nothing else* to do?',
      said: '「当てもないのに辞めろと言ったのは、あなたよね」と言う。',
      mean: 'nothing else to do ＝ 次の当てがない。辞めたのは彼の言葉のせい、と責めている。',
      trap: 'quit だけ拾うと「当てもないのに」が落ちる。不満の中身は when 以下にある。',
      use: 'Don’t quit until you have something lined up.（次が決まるまで辞めないで）' },

    // why: Were ← the final t of "weren't" is soft; Aren't ← the same "-n't" shape, wrong tense
    { id: 's1', skill: 'sound', level: 'B2', point: 'quit', seg: [29.3, 35.6],
      stem: 'Fill the gap: “___ you the guy that told me to quit my job…?”',
      choices: ['Weren’t', 'Were', 'Aren’t'], a: 0,
      cue: '文の最初の語の終わり。n の音が残るか。',
      line: '*Weren’t you* the guy that told me to quit my job',
      said: '「辞めろって言ったの、あなたじゃなかった？」と責める。',
      mean: 'Weren’t you ～? は「～だったよね」と認めさせる言い方。t は弱く n が残る。',
      trap: 't が消えると Were に聞こえやすい。否定の疑問は、念を押す場面で増える。',
      use: 'Weren’t you the one who booked this?（予約したの、君じゃなかった？）' },

    // why: Chandler ← he is the one she just snapped at; Joey ← the other friend named in the scene
    { id: 'w1', skill: 'who', level: 'B1', point: 'okay', seg: [38.4, 43.0],
      stem: 'Who tells Rachel that it’s going to be okay?',
      choices: ['Ross', 'Joey', 'Chandler'], a: 0,
      cue: '彼女の返事の最後に出る名前。',
      line: 'It’s gonna be okay. — No, it’s not gonna be okay, *Ross*.',
      said: '「落ち着いて、大丈夫だよ」と言われ、「大丈夫じゃないよ、ロス」と返す。',
      mean: '返事の最後の呼びかけで、誰に言い返しているかが分かる。',
      trap: '直前にもめた相手を選びやすい。返事の中の名前が、話している相手を決める。',
      use: 'Thanks, Mom, but I’m fine.（ありがとう、お母さん、でも大丈夫）' },

    // anchor: 40.7–42.5 s she repeats the friend's words "it's gonna be okay" with "not" added: the echo puts the
    //   contrast on "not"
    // R fix: V2 (blind 60 %): "turning his own words around" was the only clever reason; three plain reasons now
    // why: on "okay" ← questioning the word, a common reading of a repeated word; on "Ross" ← the name at the
    //   end heard as the target of blame
    { id: 'nt2', skill: 'sound', level: 'C2', point: 'okay', reveals: ['lastday'], seg: [38.4, 46.6],
      stem: 'In “No, it’s not gonna be okay, Ross,” where is the stress, and why?',
      choices: ['On “not”: flatly denying his words', 'On “okay”: questioning his choice of word',
                'On “Ross”: singling him out for blame'], a: 0,
      cue: '直前の友だちの言葉と、彼女の言葉の違う一語。',
      line: 'It’s gonna be okay. — No, it’s *not* gonna be okay, Ross. Tomorrow is my last day…',
      said: '「大丈夫だよ」と言われ、同じ言葉に not だけ足して返し、明日で最後だと理由を言う。',
      mean: '相手の言葉をくり返して一語だけ足すと、その語に強勢が来る。「大丈夫なんかじゃない」の対比。',
      trap: '最後の名前や形容詞を強く聞きやすい。くり返しの返事では、足した語に耳を向ける。',
      use: 'It’s not a small thing to me.（私には小さなことじゃないの）', retired: true },

    // why: today ← "my last day" heard without the first word; in two days ← a softer reading of "tomorrow is"
    { id: 'n1', skill: 'number', level: 'B1', point: 'lastday', seg: [40.2, 46.6],
      stem: 'When is Rachel’s last day at work?',
      choices: ['Today', 'Tomorrow', 'In two days'], a: 1, keep: true,
      cue: 'Ross と呼んだすぐあと、文の最初の語。',
      line: '*Tomorrow* is my last day, and I don’t have a lead.',
      said: '「明日が最後の日なのに、当てが一つもない」と言う。',
      mean: '辞めるまであと1日。時間がないから焦っている。',
      trap: 'last day だけ拾うと「今日」に引っぱられる。文の頭の時を表す語を先に聞く。',
      use: 'Tomorrow is my last day here.（明日でここは最後なんだ）' },

    // why: a guide ← "lead" as in a leader; a head start ← katakana リード (being ahead)
    { id: 'p2', skill: 'phrase', level: 'C1', point: 'lead', reveals: ['lastday'], seg: [40.2, 46.6],
      stem: 'When Rachel says what she doesn’t have, what does she mean?',
      choices: ['A possible job to follow up on', 'A person to guide her through it', 'A head start on the others'],
      a: 0,
      cue: 'last day のあと、and に続く部分。',
      line: 'Tomorrow is my last day, and *I don’t have a lead*.',
      said: '「明日が最後なのに、まだ当てがない」と言う。',
      mean: 'lead ＝ 手がかり、見込み。仕事探しでは「応募の当て」になる。',
      trap: 'カタカナのリードは「先に出ている」の意味。仕事や捜査の lead は、たどれる手がかり。',
      use: 'Any leads on an apartment?（部屋探し、何か当てある？）' },

    // R fix: V2 (blind 65 %): "agrees with Ross" filler replaced by a challenge reading of "you know what?"
    // why: a question ← "you know what?" taken as a real question; a point to admit ← "you know what?" heard as the
    //   lead-in to "admit it", as in an argument
    { id: 'm1', skill: 'marker', level: 'B2', point: 'decide', seg: [46.4, 51.45],
      stem: 'What does Rachel’s “Okay, you know what?” signal here?',
      choices: ['A plan she has just made up', 'A question she wants Ross to answer', 'A point she wants Ross to admit'], a: 0,
      cue: '短い前置きのあと、何が続くか。',
      line: '*Okay, you know what?* I’m just gonna…',
      said: '「よし、こうする」と言って、店長に電話するつもりだと話し出す。',
      mean: 'you know what? は答えを求めない。思いついたことや決めたことを言う前の合図。',
      trap: '疑問の形なので「知ってる？」と取りやすい。上がり調子でも、答えを待たずに続く。',
      use: 'You know what? Let’s just order pizza.（よし、もうピザ頼もう）' },

    // R fix: N7: "from tomorrow" in a distractor gave away n1's key
    // why: fired ← "my last day" heard as being let go; already said she'd stay ← "I'm not quitting" heard as old news
    { id: 'i2', skill: 'infer', level: 'B2', point: 'gunther', reveals: ['decide'], seg: [46.4, 51.45],
      stem: 'From her plan to call Gunther, what has Rachel already done?',
      choices: ['Told Gunther that she is leaving', 'Been let go by Gunther already',
                'Promised Gunther she would stay'], a: 0,
      cue: '電話で伝える言葉の、not のあと。',
      line: 'I’m gonna call Gunther, and I’m gonna *tell him I’m not quitting*.',
      said: '店長に電話して「やっぱり辞めない」と伝えるつもりだと言う。',
      mean: '「辞めない」と言い直すのは、もう辞めると伝えてあるから。last day もそのため。',
      trap: 'last day はクビの意味にも取れるが、辞めるかどうかを自分で決めている。',
      use: 'Actually, I’ve changed my mind.（やっぱり、気が変わった）' },

    // anchor: 51.6–54.2 s a friend names it: "you don't want to give in to the fear?"; 54.1–59.7 s she attacks "your
    //   fear" and never says the fear isn't hers
    // R fix: V2 (blind 70 %): the raise filler replaced by a flip of "I don't have a lead"
    // why: misses the job ← calling him heard as warmth toward her old job; an offer ← "I don't have a lead" misheard,
    //   so the call looks like leverage
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'gunther', reveals: ['fear', 'hatefear'], seg: [46.4, 57.9],
      stem: 'When Rachel decides to call Gunther, what is she trying not to say?',
      choices: ['That she is scared of having no job', 'That she quietly misses working there',
                'That she has an offer she hasn’t mentioned'], a: 0,
      cue: '彼女の決心に、友だちが付けた名前と、その返し方。',
      line: 'you don’t want to *give in to the fear*? — You and your stupid fear.',
      said: '「辞めない」と決めた直後、「恐れに負けるの？」と言われ、「あなたの恐れなんて」と返す。',
      mean: '理由を言わずに決めたことを、友だちが恐れと名づける。否定せず相手を責めるのは、図星だから。',
      trap: '電話する相手から理由を考えやすい。言い返しが中身の否定か、相手への攻撃かで本心を見る。',
      use: 'Okay, maybe I’m a little scared.（まあ、ちょっと怖いのかも）', retired: true },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'fear', seg: [51.5, 54.15],
      stem: 'Type the missing words: “You don’t want to ___ the fear?” (3 words)', answer: 'give in to',
      cue: 'want to のあと、fear の前の短い3語。',
      line: 'you don’t want to *give in to* the fear?',
      said: '「恐れに負けたくはないだろう？」と問いかける。',
      mean: 'give in to ＝ 〜に屈する、負ける。3語がつながり「ギヴィントゥ」に近い。',
      trap: 'in と to が弱く、give だけ聞こえやすい。語の数を手がかりに、弱い語を補う。',
      use: 'Don’t give in to the pressure.（プレッシャーに負けないで）' },

    // R fix: V2 (blind 55 %): "tease him back" replaced by a supportive reading of his question
    // why: ashamed ← "fear" heard as her own; glad ← "you don't want to give in to the fear?" heard as support
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'hatefear', seg: [51.5, 60.0],
      stem: 'How does Rachel feel about his talk of fear?',
      choices: ['Sick of hearing about it', 'Ashamed of being so afraid', 'Glad he understands her fear'], a: 0,
      cue: 'stupid のあとの短い一文。',
      line: 'You and your stupid fear. *I hate your fear.*',
      said: '「あなたとあなたのくだらない恐れ。その恐れが大嫌い」と言う。',
      mean: '恐れの話はもう聞きたくない、という強いいら立ち。言葉そのものが気持ちを示す。',
      trap: 'fear を自分の恐れと取ると「恥」に聞こえる。your が付いて、相手の話への不満。',
      use: 'I’m so tired of hearing about it.（その話、もううんざり）' },

    // R fix: V2 (blind 55 %): the cheer filler replaced by a "the news could cheer her up" reading
    // why: asks about the news ← the usual reply to "I got great news"; cheer her up ← good news arriving just when
    //   Rachel is down
    { id: 'r1', skill: 'predict', level: 'B2', point: 'run', seg: [51.5, 62.85], then: [62.85, 65.5],
      stem: 'Right after Joey says he has great news, what kind of reply comes?',
      choices: ['A warning that he came at a bad time', 'A question about what the news is',
                'A plea to cheer Rachel up with it'], a: 0,
      cue: '直前の彼女の様子から、次の一言を考えて。',
      line: 'Hey, I got great news. — *Run, Joey, run for your life!*',
      said: '彼女が怒りを爆発させかけた瞬間、ジョーイが「いい知らせ！」と入ってきて、「逃げろ」と言われる。',
      mean: '怒っている人の前に明るく入ってきたので、話を聞くより先に逃がそうとする。',
      trap: 'いい知らせには「何？」と返すのが普通。直前の空気が、次の返事の型を変える。',
      use: 'Bad timing, man. Come back later.（タイミング悪いよ、あとでね）' },

    // R fix: K1: "her threat is cut off halfway" is part of the joke and can be defended; now a jealousy reading
    // why: Joey's news ← the laugh lands on his line, so the news seems to be the joke; jealousy ← the broken script of
    //   "great news" met with envy; "run for your life" is about danger, not envy
    { id: 'h1', skill: 'humor', level: 'C1', point: 'run', seg: [57.95, 65.5],
      stem: 'Why does the shout after Joey’s entrance get a laugh?',
      choices: ['It treats her anger as real danger', 'His great news sounds a bit silly', 'It warns him off out of jealousy'],
      a: 0,
      cue: '入ってくる直前の彼女の言葉と、彼の第一声。',
      line: 'I would like to take you and your fear… — Hey, I got great news. — *Run, Joey, run for your life!*',
      said: '彼女が言いかけた瞬間、ジョーイが明るく入ってくる。誰かが「命がけで逃げろ」と叫ぶ。',
      mean: '怒りの真っ最中に陽気な人が来るずれと、彼女を危ない動物のように扱う大げさな警告が笑い。',
      trap: '知らせの中身やねたみではなく、叫びが彼女を危険物扱いする点が笑いの元。',
      use: 'Run for your life!（全力で逃げて！）' },

  ]
};
