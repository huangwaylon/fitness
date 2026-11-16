// “Ron Swanson Tells Diane He Loves Her | Parks and Recreation” (the official Parks and Recreation channel, Season 5):
// Ann and Ron babysit Diane's girls, who lock themselves in to "do surgery" with Ann's medical bag and cut hair; Ron
// lets slip to Ann that he loves Diane, denies it, and later says it to Diane when she takes the news calmly.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 170 s. Speakers are settled by "Jerry"
// (35 s), "talk to Ron" (75.4 s), "you love Diane?" (95 s), "Diane" (132.6 s) and by sense (the nurse's bag is the one
// Ann takes away at 78 s). Untested on purpose: the girls' lines (23.6–27.4 s, 45.4–48.6 s, 69.2–71.5 s, 75.7 s,
// 105–109.8 s, 116–122.8 s: in whisper only, the captions have nothing or "girls groan"), 66.7 s ("so many keys",
// whisper only), 98.5 s (captions "that is okay", whisper "that is so cute"), 100.7 s (captions "Henson", whisper
// "Hanson"), 148.9–150.3 s (captions "in the dryer zone", whisper "on the dryers": i2 keys on the story, not the words).
// EAR CHECK: 132.6 s w1 — "Diane, this is all my fault… my nurse's bag" is Ann's (a woman's voice; assumed from the bag)
// REVIEW 2026-11-16: pass 5, fix 19, drop 0, new 0; ear checks 1 (unchanged)
import type { Clip } from '../types.ts';

export const ronDiane: Clip = {
  id: 'rondiane', video: 'jOoTPjSrFXw', title: 'Ron Swanson Tells Diane He Loves Her', dur: 181, wpm: 152,
  band: 'slow', tags: ['恋愛', '家'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: nurses ← "nurse's bag" comes later and medical tools are hers; babysitters ← the word is said right after
    { id: 'd1', skill: 'detail', level: 'B1', point: 'doctors', seg: [5.7, 12.3],
      stem: 'In her comment to the camera, what does she say the girls want to be?',
      choices: ['Babysitters, like her', 'Doctors, when they grow up', 'Nurses, when they are older'], a: 1,
      cue: '「they even said」のあと。',
      line: 'They even said they want to be *doctors* when they grow up.',
      said: '「一番楽しい。将来は医者になりたいって」と話す。',
      mean: 'they even said ＝「〜とまで言った」。うれしさが伝わる。',
      trap: 'すぐあとに babysitters と言うので引かれやすい。何になりたいかは when の前。',
      use: 'She even said she wants to come back.（また来たいとまで言ってたよ）' },

    // R fix: V2 (blind 60 %, right): only the key named a mechanism that backfires, and "sitters who never let kids have
    //   fun" was a filler. Now all three give a target plus a mechanism.
    // why: other sitters ← "for you babysitters out there" heard as the target; the girls ← right mechanism (a plan going
    //   wrong), wrong target: they only do what they were taught
    // anchor: 11.8–17.2 s "Hot tip… let your kids play with medical tools all the time", then at once 17.2 s "We have a
    //   problem": the cut answers her own advice
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'tip', reveals: ['doctors'], seg: [5.7, 19.0],
      stem: 'In the babysitting tip to the camera, who is the joke on?',
      choices: ['The speaker, whose tip is proved wrong at once', 'Other sitters, who would never try such a tip',
                'The girls, who turn the tip into trouble at once'], a: 0,
      cue: 'アドバイスの直後、最初に聞こえる一言。',
      line: 'Hot tip for you babysitters out there… let your kids play with *medical tools* all the time. — *We have a problem.*',
      said: '「子どもには医療道具でいつも遊ばせて」と自信満々に勧めた直後、「問題発生」の声が入る。',
      mean: '本人は本気の助言。直後の一言がそれを打ち消すので、笑われるのは助言した本人。編集の「前ふり」。',
      trap: '子どもがやりすぎた、と取りやすいが、教わった通りにしただけ。助言の直後に来る一言で、誰の話か決まる。',
      use: 'Pro tip: never say “What could go wrong?”（ひとこと助言：「何が起きる？」は禁句）' },

    // R fix: V2 (blind 70 %, right): the key was the only specific choice. All three now start "lock themselves in". S3:
    //   the cue held "hair", which only the key had.
    // why: Ann's bag ← scissors + "I let them go into my nurse's bag", but the bag is carried off whole (78 s); toes ←
    //   "Let's cut off our toes!" (whisper only) and "surgery", against "Nobody got hurt" (83 s)
    { id: 'g1', skill: 'gist', level: 'B1', point: 'problem', seg: [16.6, 79.9],
      stem: 'What goes wrong while the girls are being watched?',
      choices: ['They lock themselves in and cut one girl’s hair', 'They lock themselves in and cut up Ann’s bag',
                'They lock themselves in and hurt their toes'], a: 0,
      cue: '最後の「clean up all this …」で片付ける物。',
      said: '中から鍵をかけ、「手術」ごっこでハサミを使い、髪を切ってしまう。',
      mean: 'door、scissors、hair の3語で流れが分かる。',
      trap: 'surgery から「けが」を想像しやすいが、nobody got hurt と言う。',
      use: 'Put that down, please.（それ、置いてちょうだい）' },

    // R fix: V2 (blind 85 %, right): the stem quoted the phrase, so knowing the idiom answered it. The stem now names the
    //   moment, and the choices are three readings of the words at the door. Ron isn't named in the audio here, so the
    //   stem doesn't name him.
    // why: talk it over ← "negotiation" heard without the "not"; join the game ← the girls' "surgery" makes the whole
    //   scene play
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'negotiation', seg: [18.7, 24.2],
      stem: 'What are the girls told first, through the locked door?',
      choices: ['There is nothing to talk about: open up now', 'They can talk it over once they open the door',
                'An adult will join their game if they let him in'], a: 0,
      cue: '直後の命令文に注目。',
      line: 'Girls, this is *not a negotiation*. Unlock the door immediately.',
      said: '「交渉じゃない。今すぐドアを開けなさい」と言う。',
      mean: '「話し合いの余地はない、言う通りにしろ」という言い方。命令の前置き。',
      trap: 'negotiation から「取引」の話を予想しやすいが、not が付いて「取引しない」。すぐ後の命令が答え。',
      use: 'This is not up for discussion.（これは話し合う余地なし）' },

    // R fix: V2 (blind 70 %, right): "how the speaker usually feels" pointed at a contrast. The stem now asks about Jerry,
    //   and the choices say nothing about the speaker, whose identity the audio doesn't settle. S4: the segment ran into
    //   "Well, it's…" (38.67 s). It now ends before it.
    // why: never been here ← "never thought I would say this" heard as a first visit; saves the day ← the face value of
    //   "so glad you're here", missing that "never thought" turns it
    { id: 'i1', skill: 'infer', level: 'C1', point: 'jerry', seg: [32.4, 38.65],
      stem: 'What does the line greeting Jerry suggest about him?',
      choices: ['Jerry is not usually a welcome sight', 'Jerry is usually the one who saves the day',
                'Jerry has never been to this house before'], a: 0,
      cue: '「I never thought I would say this」の働き。',
      line: 'Jerry, *I never thought I would say this*, but I am so glad you’re here.',
      said: '鍵を出した Jerry に「こんなこと言う日が来るとは。来てくれてうれしい」と言う。',
      mean: '「言うとは思わなかった」＝ふだんは逆。いつもは歓迎していない。',
      trap: 'glad の部分だけ聞くと感謝に取れる。前置きが、ふだんとの違いを示している。',
      use: 'I never thought I’d say this, but thanks.（まさか言うとは。でもありがとう）' },

    // R fix: V2 (blind 50 %, right): "it would have to" was no near sound. "It ought to" ("oughta") differs from “it's
    //   gotta” by one onset.
    // why: going to ← gotta and gonna differ only in the middle consonant; ought to ← "oughta" is "gotta" without the g
    { id: 's1', skill: 'sound', level: 'B2', point: 'gotta', seg: [38.0, 41.4],
      stem: 'Fill the gap: “Well, ___ be one of these, right?”',
      choices: ['it’s got to', 'it’s going to', 'it ought to'], a: 0,
      cue: '「well」のすぐあと、短くつながる音。',
      line: 'Well, *it’s got to* be one of these, right?',
      said: '鍵の束を見て「この中のどれかのはずだよな」と言う。',
      mean: 'got to が「ガラ」とつながる（gotta）。t が弾んで「ラ」に近くなる。',
      trap: 'gonna（going to）は「ナ」、gotta は「ラ」。真ん中の子音で聞き分ける。',
      use: 'It’s got to be here somewhere.（どこかにあるはずなんだけど）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'pressure', seg: [50.3, 55.15],
      stem: 'Type what he says: “Okay, I’m not good ___ like this.” (2 words)', answer: 'under pressure',
      cue: '「I’m not good」のあと、「like this」の前。',
      line: 'Okay, I’m not good *under pressure* like this.',
      said: '鍵が開かず「こういうのは苦手なんだ」と言う。',
      mean: 'under pressure ＝ 急かされて。good の d と under がつながる。',
      trap: 'good under が「グダンダー」と一続きになる。under の u は「ア」に近い。',
      use: 'I don’t work well under pressure.（追いつめられると力が出ない）' },

    // R fix: V2 (blind 70 %, right): "offering to clean up for them" was weak. It's now a scolding reading.
    // why: asking why ← "why don't you" read as a real question about the past; scolding ← "Why don't you…?" heard as a
    //   reproach, the 「なんで〜しないの」 frame
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'whydont', seg: [70.6, 75.8],
      stem: 'After the door opens, what is Ann doing with “Why don’t you girls…”?',
      choices: ['Telling them what to do next', 'Asking why they haven’t cleaned up', 'Scolding them for the mess they made'],
      a: 0,
      cue: '「you know …?」のあと、文の形。',
      line: 'Okay, you know what? *Why don’t you* girls clean up all this hair',
      said: '「みんなは髪を片付けて。私は Ron と話してくる」と言う。',
      mean: 'Why don’t you…? は理由を聞く質問ではなく、提案や軽い指示。',
      trap: 'why を「なぜ」と取ると「なぜ片付けないの？」になる。ここは「〜したら？」。',
      use: 'Why don’t you sit down for a minute?（ちょっと座ったら？）' },

    // why: grow back ← a common reassurance, not said here; cleaned up ← "clean up" was just said, as an order
    { id: 'd3', skill: 'detail', level: 'B1', point: 'hurt', seg: [79.4, 84.7],
      stem: 'Why does Ann think the situation is not that bad?',
      choices: ['The girls have already cleaned up', 'Nobody got hurt in the end', 'The hair will soon grow back'], a: 1,
      cue: '「not that bad」のすぐあと。',
      line: 'It’s not that bad. *Nobody got hurt*.',
      said: '「直して」と言われ、「そんなにひどくない。誰もけがしてないし」と返す。',
      mean: 'not that bad ＝ そこまでひどくない。理由はすぐあとに言っている。',
      trap: '髪は伸びる、は言いそうだが言っていない。clean up は少し前の指示の言葉。',
      use: 'It’s not that bad. Nobody’s mad.（そこまでひどくないよ。誰も怒ってないし）' },

    // R fix: V2 (blind 60 %, right): "like his own" was easy to cut. The new distractor keeps "watch/keep her kids" and
    //   changes only what he wants to show.
    // why: keep them happy ← "capable of watching her children" heard without the "without…" end; without Ann ← "show
    //   her that I'm capable" heard as alone
    { id: 'd2', skill: 'detail', level: 'B2', point: 'show', seg: [83.4, 91.5],
      stem: 'What does Ron say he wants to show Diane?',
      choices: ['That he can watch her kids safely', 'That he can keep her kids happy', 'That he can watch them without Ann'],
      a: 0,
      cue: '「capable of」のあと、文の最後まで。',
      line: 'I just want to show her that I’m *capable of watching her children without something horrible happening*.',
      said: '「ひどいことを起こさずに子どもを見られる、と見せたい」と言う。',
      mean: 'be capable of ～ing ＝ ～する力がある。',
      trap: 'children で止めると「楽しませる」とも取れる。without のあとは事故の話。',
      use: 'I’m capable of handling this.（これくらい自分でできます）' },

    // R fix: V2 (blind 60 %, right): "Do you just say" didn't fit "just" plus a past moment, so it was out at once.
    //   "Could you" ("couldja") is a near sound that makes a real request.
    // why: Could ← "couldja" vs "didja"; Didn't ← a challenging reading, and n't's t drops; Would ← the w-ish glide
    { id: 's2', skill: 'sound', level: 'B2', point: 'didyou', seg: [92.4, 95.5],
      stem: 'Fill the gap: “___ just say you love Diane?”',
      choices: ['Could you', 'Did you', 'Didn’t you', 'Would you'], a: 1,
      cue: '文の最初、つながった短い音。',
      line: '*Did you* just say you love Diane?',
      said: '「今、Diane が好きって言った？」と聞き返す。',
      mean: 'did you が「ディジュ」とつながる。just say（たった今言った）と合うのは過去形。',
      trap: 'Didn’t なら「言ったよね？」と詰める感じ。n’t の「ン」が聞こえるかで判断。',
      use: 'Did you just call me “sir”?（今「サー」って呼んだ？）' },

    // R fix: V2 (blind 60 %, right): "asks her to keep quiet" was an add-on only one choice had. All three are now one
    //   move.
    // why: admits ← "Yes, you did" comes right after and can stick as his answer; the girls ← the backpedal script, and
    //   "her children" was in his last line
    { id: 't1', skill: 'attitude', level: 'B1', point: 'deny', seg: [92.4, 98.45],
      stem: 'When Ann asks about what he just said, how does Ron answer?',
      choices: ['He says he meant he loves the girls', 'He flatly denies that he said it',
                'He admits it, but only to Ann'], a: 1,
      cue: '質問のすぐあとの短い返事と、そのあとの一言。',
      line: '*No, I did not.* — Yes, you did.',
      said: '「言ってない」と短く否定し、すぐ「言ったよ」と返される。',
      mean: 'たった今言ったことを、言い訳もせず否定している。照れ隠し。',
      trap: '最後の Yes, you did を彼の返事と取りやすい。声が替わったところに注意。',
      use: 'I did not. — You totally did.（言ってないって。——絶対言った）' },

    // R fix: V2 (blind 75 %, right): "the girls may be hurt" was settled a moment before, so it was out. Its replacement
    //   is the secrecy he asks of the girls a few seconds later.
    // why: feelings are bigger ← "larger problem" read as his love being the issue; keep his secret ← "please don't tell
    //   your mother" (113 s) moved onto Ann
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'focus', reveals: ['deny'], seg: [97.0, 103.7],
      stem: 'What is Ron doing when he tells Ann to “focus”?',
      choices: ['Moving the talk back to the haircut', 'Saying his feelings are the bigger problem',
                'Asking her to keep his secret from Diane'], a: 0,
      cue: '「for God’s sake」のあと、何を話題にしたいか。',
      line: 'For God’s sake… will you please *focus on the larger problem*?',
      said: '「頼むから、もっと大きな問題に集中してくれ」と言う。',
      mean: 'larger problem ＝ 髪のこと。自分の失言から話をそらしている。',
      trap: 'larger problem を「恋の悩み」と取ると逆になる。口止めを頼む相手はこのあとの子どもたち。',
      use: 'Can we get back to the main issue?（本題に戻ってもいい？）' },

    // R fix: V2 (blind 75 %, right): the key was the only punchline ("gives the truth away"). All three now describe
    //   what he does with the girls.
    // why: making up a story ← "incorrectly" taken at face value; listening in ← "what you think you heard" read as
    //   eavesdropping
    { id: 'h1', skill: 'humor', level: 'C1', point: 'tellmom', seg: [109.3, 116.4],
      stem: 'Why is Ron’s request to the girls funny?',
      choices: ['He asks them to hide what he says is false', 'He tells them off for making up a story',
                'He tells them off for listening in'], a: 0,
      cue: '「but please」のあと、何を頼んでいるか。',
      line: 'I don’t know what you think you heard, but *please don’t tell your mother* what you *incorrectly* think you heard.',
      said: '「聞いたと思ってることは、お母さんに言わないでくれ」と頼む。',
      mean: '聞き違いなら口止めはいらない。頼むほど本当だとばれる。',
      trap: 'incorrectly を信じると「うそを叱る」に見える。否定と口止めがセットなら本音は口止め。',
      use: 'Whatever you heard, keep it to yourself.（何を聞いたにせよ、内緒でね）' },

    // R fix: K5 + V2 (blind 65 %, right): the key was a structure and the distractors were contents. All three are now
    //   "X, but/and Y" openings.
    // why: nothing happened ← "everyone is fine" heard alone, "but" missed; someone hurt ← "no one" vs "someone" near
    //   sound
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'incident', seg: [122.0, 129.8],
      stem: 'How is the news broken to Diane when she arrives?',
      choices: ['Everyone’s fine, but something happened', 'Someone got hurt, but it’s not serious',
                'Everyone’s fine, and nothing happened'], a: 0,
      cue: '「first of all」のあと、but の前と後。',
      line: '*First of all*, everyone is fine. No one got hurt, *but* there was an incident.',
      said: '「まず、みんな無事。けがはない。でも、ある出来事が」と切り出す。',
      mean: '安心させてから悪い話に入る、典型的な前置き。incident ＝ 出来事、事件。',
      trap: 'fine と no one だけ拾うと「何もない」になる。but のあとに本題が来る。',
      use: 'First of all, everyone’s okay, but…（まず、みんな無事なんだけど…）' },

    // R fix: V2 + §9.4 (blind 70 %, right): the title says he tells her, so "goes back to denying" was out. All three now
    //   end in "I love you" and differ in how Diane takes the news. C5: the choices state the ending, so it reveals
    //   `lovetoo`.
    // why: angry with Ann ← "this is all my fault" is said, but Diane isn't upset; to calm her ← "I'm still incredibly
    //   sorry" read as her being upset
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['calm', 'lovetoo'], seg: [122.0, 168.05],
      stem: 'How does Diane take the news, and where does it lead?',
      choices: ['She takes it calmly, and the two say “I love you”', 'She is angry with Ann, then the two say “I love you”',
                'She is upset, so Ron says “I love you” to calm her'], a: 0,
      cue: '彼女の最初の反応と、最後の二人のやりとり。',
      said: 'Diane は怒らず、謝る Ron に「だから好き」と言い、Ron も同じ言葉を返す。',
      mean: '悪い知らせの場面が、気持ちを伝え合う場面に変わる流れ。',
      trap: 'Ann が「私のせい」と言うので責められる話に見えるが、Diane は最初から怒っていない。',
      use: 'It turned out fine in the end.（結局うまくいったよ）' },

    // why: Ron ← he was the one most upset about it; Jerry ← the other man there, who opened the door
    { id: 'w1', skill: 'who', level: 'B1', point: 'fault', seg: [132.0, 137.4],
      stem: 'Who tells Diane “this is all my fault”?',
      choices: ['Ann, who brought the bag', 'Ron, who was most upset', 'Jerry, who had the keys'], a: 0,
      cue: '声の高さと、「my」のあとの持ち物。',
      line: 'Diane, this is all my fault. I let them go into *my nurse’s bag*.',
      said: '女性の声で「全部私のせい。私の看護師のかばんを使わせちゃった」と言う。',
      mean: 'かばんの持ち主が責任を引き受けている。',
      trap: '一番気にしていたのは Ron なので彼と思いやすい。声と「my nurse’s bag」で判断。',
      use: 'That’s on me. I’m sorry.（それは私の責任です。ごめんなさい）' },

    // R fix: V2 (blind 65 %, right): "afraid someone got hurt" didn't fit a stem about the haircut. Now a hidden-upset
    //   reading (the 本音と建前 frame).
    // why: wants a name ← "who has…?" heard as a demand for the guilty one; hiding it ← a cheerful tone read as a cover
    { id: 'i3', skill: 'infer', level: 'B2', point: 'calm', seg: [139.4, 142.8],
      stem: 'What does Diane’s first reaction to the haircut suggest?',
      choices: ['She is teasing, not angry', 'She wants to know who did it', 'She is upset but hiding it'],
      a: 0,
      cue: '「scissors」の前の言葉と、文末の一語。',
      line: 'Well, who has been *having fun* with scissors, *huh*?',
      said: '「ハサミで遊んでたのは誰かな？」と子どもに声をかける。',
      mean: 'having fun と huh で、責めるより冗談めかした問いかけ。',
      trap: 'who で始まる問いは犯人探しに聞こえやすい。言葉の選び方で調子を判断。',
      use: 'Who’s been eating my cookies, huh?（クッキー食べてたのは誰かな？）' },

    // R fix: V2 (blind 75 %, right): "a way to fix the haircut" was a filler. Zoe is the one told to put the scissors
    //   down (55.7 s), so "Zoe is to blame" is the strong keyword trap.
    // why: Zoe to blame ← "Zoey, put the scissors down" earlier, plus her name here; getting worse ← "once" missed, the
    //   story heard as new
    { id: 'i2', skill: 'infer', level: 'C1', point: 'calm', seg: [144.9, 150.55],
      stem: 'Why does Diane mention something Zoe once did?',
      choices: ['To say the girls have done worse before', 'To say Zoe is the one to blame here',
                'To warn that Zoe’s games are getting worse'], a: 0,
      cue: '「they’re kids」のあと、「once」で始まる話。',
      line: 'It’s fine. *They’re kids.* *Once* Zoe put Ivy in the dryer…',
      said: '「平気よ、子どもだもん。前に Zoe が Ivy を乾燥機に入れたこともあったし」と言う。',
      mean: 'もっとひどい前例を出して、今回は大したことないと伝えている。',
      trap: 'Zoe の名前が出るので犯人の話に聞こえやすい。once で始まるのは昔の話の合図。',
      use: 'Don’t worry. Once I locked myself out.（気にしないで。私なんか締め出されたことある）' },

    // why: relieved ← "it's fine" comes just before; annoyed ← "still" heard as frustration that she takes it lightly
    { id: 't2', skill: 'attitude', level: 'B2', point: 'sorry', seg: [146.3, 153.45],
      stem: 'After Diane says it’s fine, how does Ron sound?',
      choices: ['Relieved, and ready to move on', 'Still truly sorry for letting her down',
                'Annoyed that she takes it so lightly'], a: 1,
      cue: '「it’s fine」のあと、彼の最初の語。',
      line: 'I’m *still incredibly sorry*. I feel like I *let you down*.',
      said: '「それでも本当にごめん。期待を裏切った気がする」と言う。',
      mean: 'still ＝「それでも」。許されたあとも謝り続ける、本気の謝罪。',
      trap: 'fine の直後なので安心したと思いやすい。still は「まだ」の気持ちが続く合図。',
      use: 'I feel like I let you down.（期待に応えられなかった気がする）' },

    // R fix: V2 (blind 70 %, right): "What actually wins" pointed at the opposite of his plan. "Actually" is gone, and the
    //   distractors are now near misses: honesty (his apology heard as owning up) and calm.
    // why: honest ← "I let you down" heard as a confession; calm ← "It's fine" read as his doing
    // anchor: 85.3–91 s "I just want to show her that I'm capable…" against 153.5–158 s "so sweet… how much you care.
    //   This is why I love you": the failure, not the skill, wins her
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'care', reveals: ['show', 'sorry'], seg: [150.1, 164.4],
      stem: 'Ron wanted to prove he could mind her kids. What wins Diane over?',
      choices: ['How much he cares, shown by his apology', 'How honest he is, shown by owning up',
                'How calm he stays, though it went wrong'], a: 0,
      cue: '彼女の「so sweet」のあと、何をほめているか。',
      line: 'It is so sweet to me *how much you care*. *This is why* I love you.',
      said: '謝り続ける Ron に、彼女は「気にかけてくれるのがうれしい。だから好き」と言う。',
      mean: '腕前を見せたかったのに、響いたのは失敗して気にする姿。狙いと結果がずれている。',
      trap: '謝る姿から「正直さ」と取りやすい。彼女が口にする語は care。This is why の this はそれを指す。',
      use: 'It means a lot that you care.（気にかけてくれて、すごくうれしい）' },

    // R fix: V2 (blind 80 %, right): "practiced" and "tease" were weak. The choices now differ only in what he did with
    //   Ann, which the 95–97 s exchange settles.
    // why: kept quiet ← the denial remembered as silence; admitted ← "Yes, you did" remembered as his line
    // anchor: 95.5–96.5 s "No, I did not." and 113–116 s "please don't tell your mother", against 161–163.3 s "Well, I
    //   love you, too.": what he hid from the girls he now says with one "Well"
    // retired: g2 reveals its point, so play 3+ under g2 drew no C2
    { id: 'nt3', skill: 'humor', level: 'C2', point: 'lovetoo', reveals: ['deny', 'tellmom'], seg: [153.0, 164.4], retired: true,
      stem: 'Set against the earlier scenes, why is Ron’s answer to Diane funny?',
      choices: ['He denied it to Ann, then says it to Diane at once', 'He kept quiet with Ann, then says it to Diane at once',
                'He admitted it to Ann, so saying it now is easy'], a: 0,
      cue: '少し前、同じ言葉を聞かれたときの返事と比べて。',
      line: 'This is why I love you. — Oh. *Well, I love you, too.*',
      said: '「だから好き」と言われ、「ああ、まあ、僕も好きだよ」とあっさり返す。',
      mean: 'さっきは「言ってない」と否定し、子どもに口止めまでした言葉。本人に言われると、すんなり出てくる。',
      trap: 'Ann への返事を「黙った」「認めた」と覚えがち。前の場面の言葉そのものを思い出すと落差が分かる。',
      use: 'Well, since you asked… yes.（まあ、聞かれたから言うけど…うん）' },

    // R fix: V2 (blind 85 %, right): "a sign I should help out" was weak. Taking the girls out is the near miss, refuted
    //   by "All right, girls, good hang", a goodbye to them.
    // why: my turn to talk ← cue = 合図 in a play, read as a speaking turn; take the girls ← leaving the couple alone,
    //   but with the kids
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'cue', seg: [163.8, 168.05],
      stem: 'After the two say “I love you”, what does “That’s my cue” mean?',
      choices: ['It’s time for me to leave you two', 'It’s time to take the girls out', 'It’s my turn to say something nice'],
      a: 0,
      cue: 'そのあと、女の子たちに何と言うか。',
      line: '*That’s my cue.* All right, girls, good hang.',
      said: '二人が「好き」と言い合ったのを聞いて、「じゃ、私はこれで」と帰り支度をする。',
      mean: 'cue ＝ 舞台の出番の合図。ここは「退場の合図」、二人きりにする気づかい。',
      trap: 'cue を「話す番」と取りやすい。続く別れのあいさつが答え。',
      use: 'That’s my cue to go to bed.（そろそろ寝る時間だな）' },

    // R fix: V2 (blind 90 %, right): "hanging up your things" was absurd. Now two other parting lines. C5: its notes say
    //   she is leaving, f2's key, so it reveals `cue`.
    // why: got through it ← "hang" heard as "hang in there"; be good ← a parting line read as the usual "behave"
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'hang', reveals: ['cue'], seg: [164.1, 168.05],
      stem: 'What does she mean by “good hang” to the girls?',
      choices: ['Thanks for a fun time together', 'Well done, you got through it',
                'Be good while I’m away'], a: 0,
      cue: '帰り際、子どもたちへの最後のひとこと。',
      line: 'All right, girls, *good hang*.',
      said: '帰るときに、女の子たちに「楽しかったよ」と声をかける。',
      mean: 'hang（out）＝ 一緒に過ごす。good hang は「いい時間だったね」の軽い言い方。',
      trap: 'Hang in there（がんばれ）と混ざりやすい。別れ際なら、過ごした時間の話。',
      use: 'Fun hang tonight. Let’s do it again.（今夜楽しかった。またやろう）' },
  ]
};
