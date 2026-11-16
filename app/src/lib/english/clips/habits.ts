// “Everyone's Annoying Habits | Friends” (the official Friends channel, Best of Season 1): told off for his own habit,
// Chandler lists his friends' flaws (Joey's knuckle-cracking, Ross's over-pronouncing, Monica's snort) and asks to be
// accepted; the friends turn on one another instead.
// Segments from the captions, words from whisper (2026-11-16). Untested: 0–10 s (whisper only: "don't do that",
// "worse than the thumb", which needs the show's backstory), 58–60 s ("Oh, you do, do you?": speaker and tone unclear),
// and 86–105 s (music; whisper loops invented lines).
// REVIEW 2026-11-17: pass 5, fix 16, drop 0, new 0; ear checks 1
// OPEN: d2, d3 and d1 stay blind-guessable from show knowledge (Ross's pedantry, Monica's snort, knuckle-cracking);
//   the distractors are now near sounds, so only the audio settles them
// EAR CHECK: 50.5 s nt1 — both sources have “Phoebe chews her head”; the line writes “hair” (the closing “the hair
//   comes out” supports it); the key doesn't depend on the word
import type { Clip } from '../types.ts';

export const habits: Clip = {
  id: 'habits', video: 'vooZITJoPaQ', title: 'Everyone\'s Annoying Habits', dur: 105, wpm: 158, band: 'mid',
  tags: ['友だち'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 75 %): the key was the only natural trigger for a comeback. Now a second comeback reading
    //   ("so I have one too") competes, and the key no longer echoes "criticized … habits"
    // why: asked to name a flaw ← "flaw" heard as answering a question; owned up ← "So I have a flaw" heard as "so
    //   (like you) I have one too"
    { id: 'i2', skill: 'infer', level: 'B2', point: 'flaw', reveals: ['bigdeal'], seg: [9.6, 13.3],
      stem: 'What does Chandler’s opening, “So I have a flaw”, tell us just happened?',
      choices: ['Someone objected to something he does', 'Someone asked him to name his worst flaw',
                'Someone owned up to a flaw of their own'], a: 0,
      cue: '文頭の So の言い方。返事か、言い返しか。',
      line: '*So I have a flaw.* Big deal.',
      said: '「だから何、欠点くらいあるよ。大したことない」と開き直る。',
      mean: '文頭の So は、責められた直後の言い返し。直前に注意されたと分かる。',
      trap: 'flaw だけ拾うと「欠点を聞かれた」と取りやすい。返事の勢いを聞く。',
      use: 'So I was late. Big deal.（遅れたからって、何？）' },

    // R fix: V2 (blind 55 %): two distractors were far from a shrug. Now a second minimizing reading competes
    // why: serious problem ← "big deal" read literally (大ごと); minor and fixable ← admitting a flaw heard as a
    //   concession (the お詫び frame)
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'bigdeal', seg: [9.6, 13.3],
      stem: 'When Chandler admits his flaw, how does he rate it?',
      choices: ['As nothing worth making a fuss about', 'As serious, though he can’t help it',
                'As minor, and something he will fix'], a: 0,
      cue: 'flaw の直後、短く言い放つ2語。',
      line: 'So I have a flaw. *Big deal.*',
      said: '欠点を認めたすぐあとに、2語だけで言い放つ。',
      mean: 'Big deal. だけで言うと「だから何？大したことない」という開き直り。',
      trap: '文字通り「大ごと」と取りやすい。単独で言い放つ Big deal はその逆。',
      use: 'It’s no big deal, really.（ほんとに大したことないよ）' },

    // R fix: V2 (blind 75 %): the key was the only choice with the clip's "accept". All three are now plain
    //   paraphrases; dropped the dead reveal 'fair' (no item has that point)
    // why: mildest ← the list sounds like a comparison; break together ← "flaws" + "accept" heard as a bargain
    { id: 'g1', skill: 'gist', level: 'B2', point: 'accept', seg: [9.6, 28.7],
      stem: 'Why does Chandler bring up his friends’ habits?',
      choices: ['To say they should all put up with each other', 'To show his habit is the mildest of them all',
                'To suggest they all break their habits together'], a: 0,
      cue: 'リストの最後の一文。何をしてほしい？',
      line: 'I *accept all those flaws*. Why… *accept me* for this?',
      said: '3人の癖を挙げ、「全部受け入れてるのに、なぜ僕のは受け入れない？」と言う。',
      mean: '癖を並べたのは責めるためでなく、「お互いさま」と言うための材料。',
      trap: '比べているので「自分が一番まし」と取りやすいが、言うのは accept。',
      use: 'Can’t you just accept me as I am?（ありのままの僕を受け入れてよ）' },

    // R fix: V2 (blind 80 %): "nails" was off the sound; all three now share "cracking" or "knuckles", so only the
    //   pairing settles it. (d4's stem no longer names the habit, see d4)
    // why: neck ← "cracking" is caught, "knuckle" is short and fast; drumming ← "knuckle" is caught, "cracking" isn't
    { id: 'd1', skill: 'detail', level: 'B1', point: 'knuckle', seg: [12.5, 16.4],
      stem: 'Which habit of Joey’s does Chandler mention?',
      choices: ['Cracking his knuckles', 'Cracking his neck', 'Drumming his knuckles'], a: 0,
      cue: 'Joey’s のすぐあと、続く2語。',
      line: 'Like Joey’s constant *knuckle-cracking* isn’t annoying…',
      said: 'ジョーイがしょっちゅう指の関節を鳴らす、と挙げる。',
      mean: 'knuckle ＝ 指の関節。crack ＝ ポキッと鳴らす。constant で「いつも」。',
      trap: 'knuckle は短く速い。crack だけ拾うと、首など別の場所と迷いやすい。',
      use: 'Please stop cracking your knuckles.（指をポキポキ鳴らすのやめて）' },

    // R fix: V2 (blind 50 %): "isn't annoying" was an odd thing to complain about. The literal reading is now the
    //   natural complaint ("nobody minds Joey's, so why mine?"), and "worse" became "the one to fix first"
    // why: nobody minds ← "like" read as "for example" and the words taken literally; fix first ← the list heard as a
    //   ranking against his own flaw
    { id: 'pr1', skill: 'pragma', level: 'C1', point: 'like', reveals: ['knuckle'], seg: [12.5, 16.4],
      stem: 'What is Chandler really saying in his first example, about Joey?',
      choices: ['That Joey’s habit is just as annoying', 'That nobody seems to mind Joey’s habit',
                'That Joey’s habit is the one to fix first'], a: 0,
      cue: '文頭の短い一語と、文末の否定。',
      line: '*Like* Joey’s constant knuckle-cracking *isn’t annoying*…',
      said: '「ジョーイの指鳴らしは迷惑じゃないとでも？」と言う。',
      mean: '文頭の Like … isn’t ＝「まるで〜じゃないみたいに」。つまり「あれも迷惑だろ」。',
      trap: 'Like を「例えば」と取ると文字通りの意味になる。文頭の Like は反語を疑う。',
      use: 'Like you’ve never been late!（君だって遅刻したことあるくせに）' },

    // R fix: V2 (blind 60 %): only the key held "pronounce". Now three sound-alike -ing habits, and the stem names
    //   the habit to fit them
    // why: mispronouncing ← mis-/over- both prefix "pronouncing", and the prefix is fast; over-explaining ← "over" is
    //   caught, the rest of the long word isn't
    { id: 'd2', skill: 'detail', level: 'B1', point: 'pronounce', seg: [15.8, 19.0],
      stem: 'Which habit of Ross’s does Chandler name?',
      choices: ['Over-pronouncing every word', 'Mispronouncing every word', 'Over-explaining every word'], a: 0,
      cue: 'Ross with his のあとの長い一語。',
      line: 'and Ross with his *overpronouncing* every single word',
      said: 'ロスは一語一語を発音しすぎる、と挙げる。',
      mean: 'over ＋ pronounce ＝ 必要以上にはっきり発音すること。気取って聞こえる癖。',
      trap: 'every single word だけ拾うと別の癖と迷う。長い一語の頭の over を聞く。',
      use: 'Could you say that word slowly?（その単語、ゆっくり言って）' },

    // R fix: V2 (blind 70 %): "laughs too loudly" was a loose fit. The distractors are now near sounds of
    //   "snort when she laughs"
    // why: sniffs ← snort/sniff share the opening s-n; snores ← snort/snore differ only in the last sound
    { id: 'd3', skill: 'detail', level: 'B1', point: 'snort', seg: [18.2, 21.6],
      stem: 'What does Chandler say about Monica?',
      choices: ['She snorts when she laughs', 'She sniffs when she laughs', 'She snores when she naps'], a: 0,
      cue: 'Monica with that のあと。',
      line: 'and Monica with that *snort when she laughs*',
      said: 'モニカは笑うと鼻を鳴らす、と挙げる。',
      mean: 'snort ＝ 鼻を「フゴッ」と鳴らすこと。when she laughs で、いつ鳴るかを言う。',
      trap: 'snort と sniff は出だしが同じ。when のあとの laughs まで聞く。',
      use: 'Sorry, I laugh really loudly.（ごめん、笑い声が大きくて）' },

    // why: corrects ← "I mean" = 言い直し in textbooks; explains ← "that thing" heard as clarifying which habit
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', seg: [20.3, 23.3],
      stem: 'After describing Monica’s habit, what does Chandler’s next short phrase do?',
      choices: ['Pushes his point, more bluntly', 'Corrects what he just said', 'Explains which habit he means'], a: 0,
      cue: 'snort の話のすぐあと、文頭の2語。',
      line: '*I mean*, what the hell is that thing?',
      said: '「つまりさ、あれ一体何なの？」と続ける。',
      mean: 'この I mean は訂正ではなく、言ったことを本音で強く言い足す合図。',
      trap: '「つまり」を言い直しと取りやすい。前と同じ向きに強まるなら追い打ち。',
      use: 'I mean, who does that?（だってさ、普通そんなことする？）' },

    // R fix: V2 (blind 50 %): "don't you" didn't fit "accept me for this". It's now "couldn't you", so three
    //   complaints fit the gap equally well
    // why: can ← the t of can't drops before "you"; won't ← the same complaint with another modal; couldn't ← the
    //   -n't is caught but the vowel isn't
    { id: 's1', skill: 'sound', level: 'B2', point: 'cant', seg: [24.3, 28.7],
      stem: 'Fill the gap: “Why ___ accept me for this?”',
      choices: ['can’t you', 'can you', 'won’t you', 'couldn’t you'], a: 0,
      cue: 'Why のすぐあと、つながる2語。',
      line: 'I accept all those flaws. Why *can’t you* accept me for this?',
      said: '「全部受け入れてる。なのに、なぜ受け入れられない？」と問う。',
      mean: 'can’t you が「キャンチュ」のようにつながる。t は飛んでも母音は長め。',
      trap: 'can と can’t は t が消えると似る。can’t は強く長く、can は弱く短い。',
      use: 'Why can’t you just say yes?（なんで素直にイエスと言えないの）' },

    // R fix: V2 (blind 60 %): the key was the only nuanced, two-part feeling. All three now name a feeling and its
    //   reason
    // why: sorry ← listing friends' flaws looks like going too far, so the ending sounds like an apology; pleased ←
    //   the list heard as a ranking he has won
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'accept', reveals: ['cant'], seg: [24.3, 28.7],
      stem: 'How does Chandler sound as he ends his list?',
      choices: ['Hurt that he’s held to a stricter rule', 'Pleased he has shown he isn’t the worst',
                'Sorry that he picked on his friends'], a: 0,
      cue: '最後の問いかけ。だれとだれを比べている？',
      line: 'I accept all those flaws. Why *can’t you accept me* for this?',
      said: '「僕はみんなの欠点を受け入れてる。なぜ僕だけダメ？」と問う。',
      mean: '自分は許しているのに許されない、という不公平への不満。謝ってはいない。',
      trap: '癖を並べた後なので謝罪に聞こえやすい。最後の Why can’t you に本音。',
      use: 'That’s not fair. Why just me?（ずるいよ。なんで僕だけ？）' },

    // R fix: V2 (blind 55 %) + N7: the stem named "knuckle-cracking" (d1's key), and the line and cue show it, so
    //   it now reveals 'knuckle'. A loudness distractor replaces "stop it now"
    // why: everybody does it ← "everybody" heard as "does everybody do it"; that loud ← "cracking" + "bother" heard
    //   as a question about the noise
    { id: 'd4', skill: 'detail', level: 'B1', point: 'everybody', reveals: ['knuckle'], seg: [34.8, 38.6],
      stem: 'After the speech, what does Joey ask about his habit?',
      choices: ['Whether it bothers everybody', 'Whether everybody does it too', 'Whether it is really that loud'], a: 0,
      cue: 'knuckle-cracking のあとの動詞と、最後の一語。',
      line: '…knuckle-cracking *bother everybody*?',
      said: '「指鳴らしって、みんな気になってるの？」と聞く。',
      mean: 'bother ＝ 気に障る。everybody で「全員が？」と驚いている。',
      trap: '文頭は弱く速いので聞き落としやすい。動詞 bother と最後の everybody を拾う。',
      use: 'Does the music bother you?（音楽、気にならない？）' },

    // R fix: V2 (blind 50 %): the key was the only hedged choice. Now a live-with/live-without mix-up and a second
    //   hedged reading compete
    // why: fine ← "live without it" confused with "live with it" (我慢できる = 平気); backs off ← the soft "Well…"
    //   heard as taking it back
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'could', seg: [34.8, 44.7],
      stem: 'What does the first answer to Joey’s question do?',
      choices: ['Hints, gently, that it bothers him', 'Says he can live with it, so it’s fine',
                'Jokes that it bothers him, then backs off'], a: 0,
      cue: 'Well のあと、間をおいた控えめな返事。',
      line: '*Well*… I, I *could live without it*.',
      said: '少しためらって「まあ、なくても生きていけるかな」と答える。',
      mean: 'なくても困らない＝やめてくれたら嬉しい。遠回しに「気になる」と認めている。',
      trap: 'live without を live with（平気）と混ぜやすい。Well とためらいは本音の合図。',
      use: 'Honestly, I could live without the music.（正直、音楽はなくてもいいかな）' },

    // why: owns up ← the title ("Everyone's Annoying Habits") suggests a confession round; worst ← his speech is the
    //   last thing heard about flaws
    { id: 'g2', skill: 'gist', level: 'B2', point: 'turn', reveals: ['everybody'], seg: [34.8, 86],
      stem: 'How does Chandler’s speech change the conversation?',
      choices: ['Nobody brings up his flaw again', 'Everyone agrees his is the worst',
                'Everyone owns up to their habits'], a: 0,
      cue: '後半の話題が、だれの癖になっているか。',
      line: '…*bother everybody*? … nothing wrong with *speaking correctly*.',
      said: '話はジョーイ、フィービー、ロスの癖へ移り、チャンドラーの欠点には戻らない。',
      mean: '矛先をそらす作戦が当たり、みんなが互いの癖を気にし始める。',
      trap: 'タイトルから「認め合う」と取りやすいが、誰も謝らず言い返している。',
      use: 'Let’s not make this about me.（僕の話にしないでよ）' },

    // C2: who is the joke on?
    // why: Joey ← the question is about his habit, and "a little annoying" sounds like a jab at him; Chandler ← his
    //   flaw started the whole argument
    // anchor: 47.2–51.2 s the "or" half names Phoebe's habit as the far end of the scale; 54.4–57.7 s the next speaker
    //   comforts her ("don't listen to him, Pheebs… I think it's endearing")
    // R fix: V2 (blind 50 %): "comparing levels" in the stem pointed at whoever was the comparison. The stem is now
    //   neutral, and the Joey distractor is stronger (his habit is the topic)
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'phoebe', seg: [46.7, 58.2],
      stem: 'In the question about just how annoying it is, who is the joke on?',
      choices: ['Phoebe, whose habit is brought in as the worst', 'Joey, whose habit turns out to annoy everyone',
                'Chandler, whose own habit started the fight'], a: 0,
      cue: 'or のあとの比べる相手と、次の人の返事。',
      line: '…a little annoying, or is it like *when Phoebe chews her hair*?',
      said: '「ちょっとうるさい程度？それともフィービーの髪かみくらい？」と聞く。',
      mean: 'ジョーイの癖を聞くふりで、フィービーの癖を最悪の例に使う。次の人が彼女をかばうのが証拠。',
      trap: '話題がジョーイなので、的も彼と取りやすい。比べる物に出された人が本当の的。',
      use: 'Is it bad, or Mike’s-singing bad?（まずい？それともマイクの歌くらい？）' },

    // why: odd but easy to ignore ← "endearing" unknown, so the comforting tone is taken as playing it down; annoying
    //   but forgivable ← the scene is a list of annoying habits
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'endearing', seg: [53.9, 58.2],
      stem: 'When Phoebe is told not to listen, how is her habit described?',
      choices: ['As sweet, and part of her charm', 'As odd, but easy to ignore', 'As annoying, but forgivable'], a: 0,
      cue: '文の最後の、長めの形容詞。',
      line: '…*I think it’s endearing*.',
      said: '「気にしないで、フィービー。かわいいと思う」とかばう。',
      mean: 'endearing ＝ 愛らしい、好感が持てる。欠点を魅力と言いかえてかばっている。',
      trap: 'かばう流れなので「迷惑だけど許せる」と取りやすい。endearing ははっきりほめ言葉。',
      use: 'His accent is kind of endearing.（彼のなまり、ちょっとかわいい）' },

    // R fix: V2 (blind 50 %): "to it" was weak; "to that" (dismissing the remark) fits the comfort as well as "him"
    // why: them ← "him" loses its h and sounds like "them" with a weak th; me ← "to" + a weak vowel; that ← the
    //   remark itself, dismissed
    { id: 's2', skill: 'sound', level: 'B2', point: 'him', seg: [53.9, 57.0],
      stem: 'Fill the gap: “Don’t listen ___, Pheebs.”',
      choices: ['to him', 'to them', 'to me', 'to that'], a: 0,
      cue: 'listen のあと、弱くつながる2語。',
      line: '…don’t *listen to him*, Pheebs, all right?',
      said: '「彼の言うことなんか聞かないで、フィービー」となだめる。',
      mean: 'him の h が落ちて「リスントゥイム」のようにつながる。',
      trap: 'h が消えると to them と似る。them なら th の音が残る。指すのは一人。',
      use: 'Don’t listen to him. You look great.（彼の言うこと気にしないで。素敵だよ）' },

    // R fix: K1 + V2 (blind 55 %): if someone else says "Indeed" to mock Ross, "agreement that means the opposite" is
    //   defensible, so it's out. Replaced with a "correctly" keyword trap, and the stem's quote stops before "speaking
    //   correctly". Header ear check removed: the key rests on the word "Indeed", not the voice
    // why: corrects ← "correctly" heard as the reply fixing grammar; too fast ← a quick, short agreement heard as
    //   giving in
    { id: 'h1', skill: 'humor', level: 'C1', point: 'indeed', seg: [65.6, 72.4],
      stem: 'Why does the reply to “You know, there’s nothing wrong…” get a laugh?',
      choices: ['Its stiff, formal wording is the habit itself', 'It corrects the grammar of the line before it',
                'It agrees so fast it sounds like giving up'], a: 0,
      cue: '返事の言葉づかいを、前の話と比べて。',
      line: 'there’s nothing wrong with speaking correctly. — *Indeed*, there isn’t.',
      said: '「正しく話して何が悪い」に「いかにも、悪くない」と返す。',
      mean: 'Indeed は堅い言葉。話題の「きっちりした話し方」を返事で見せていて笑いになる。',
      trap: 'correctly が聞こえると「文法を直した」と取りやすいが、直してはいない。笑いは言葉づかい。',
      use: 'Indeed, it is a lovely day.（まことに、良い日ですな）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'backwork', seg: [74.6, 76.9],
      stem: 'Type what she says: “I should really ___.” (4 words)', answer: 'get back to work',
      cue: 'really のあと、つながる4語。',
      line: 'I should really *get back to work*.',
      said: '「そろそろ仕事に戻らなきゃ」と言う。',
      mean: 'get back to ＝ 〜に戻る。get の t が飲まれ「ゲッバック」とつながる。',
      trap: 'get の t と back の k が消えやすい。4語でひとかたまりと覚える。',
      use: 'Sorry, I need to get back to work.（ごめん、仕事に戻らなきゃ）' },

    // why: too slow ← work + "orders" heard as a speed complaint; busy ← "get back to work" heard as the café needing her
    { id: 'i1', skill: 'infer', level: 'C1', point: 'ordered', reveals: ['backwork'], seg: [74.6, 79.7],
      stem: 'When she says she should get back to work, what does the reply suggest?',
      choices: ['That her orders often come out wrong', 'That she’s too slow taking orders',
                'That the café is busy without her'], a: 0,
      cue: 'otherwise のあと、最後の2語。',
      line: 'Yeah, otherwise someone might get *what they actually ordered*.',
      said: '「そうだね、じゃないと誰かが注文どおりの物を受け取っちゃう」と返す。',
      mean: '裏返すと「いつもは注文と違う物が出る」。仕事ぶりへの軽い皮肉。',
      trap: '仕事の話なので「遅い」と取りやすい。actually ＝「本当に頼んだ物」に注目。',
      use: 'Did you get what you actually ordered?（ちゃんと頼んだ物が来た？）' },

    // C2: which reply would show she understood?
    // R fix: V2 (blind 55 %): "not that busy" was off-topic. Now a "hurry up" reading competes
    // why: thanks ← "Yeah" heard as support (the お礼 frame); be quick ← "get back to work" + "otherwise" heard as
    //   "hurry, people are waiting"
    // anchor: 77.5–79.2 s "otherwise… what they actually ordered": with her away, orders come out right; her answer
    //   (79.6 s) is a stung "Well…", not thanks
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'ordered', reveals: ['backwork'], seg: [74.6, 81.0],
      stem: 'Which reply from her would show she got the point?',
      choices: ['Hey! I’m not that bad at it.', 'Thanks, I’ll make sure they do.', 'Right, I’d better be quick, then.'],
      a: 0,
      cue: 'otherwise が何を裏返しているか。',
      line: 'I should really get back to work. — Yeah, otherwise someone might get *what they actually ordered*. — *Well…*',
      said: '「仕事に戻らなきゃ」に「でないと注文どおりの物が届く」と返され、詰まる。',
      mean: '応援の形の皮肉。気づいたなら「そこまで下手じゃない」と返すはず。お礼は気づかない返事。',
      trap: 'Yeah で始まるので賛成に聞こえやすい。返事は言葉の形でなく中身に返す。',
      use: 'Hey, I’m not that bad at this!（ちょっと、そこまで下手じゃないよ）' },

    // R fix: V2 (blind 60 %): "back to work" was a weak echo. Now two other readings of "come off" compete
    //   (calling it a night; stepping back)
    // why: heading out ← "come off" + "gloves" read as taking things off to leave; keep out of it ← "hair comes
    //   out" heard as backing off, hurt
    { id: 'p2', skill: 'phrase', level: 'C1', point: 'gloves', seg: [81.0, 85.8],
      stem: 'In the clip’s last line, what is Phoebe announcing?',
      choices: ['She’ll stop being nice and hit back', 'She’s had enough and is heading out',
                'She’s hurt and will keep out of it'], a: 0,
      cue: '最後の一文の後半、come off の意味。',
      line: 'Oh, the hair comes out and *the gloves come off*.',
      said: '「髪は口から出した、もう手加減しない」と宣言する。',
      mean: 'the gloves come off ＝ 遠慮をやめて本気でやり合う。今度は自分が言い返す番。',
      trap: 'come off を「やめて帰る」と取りやすい。手袋を外す＝素手の勝負、と覚える。',
      use: 'Okay, now the gloves are off.（よし、ここからは本気だ）' },
  ]
};
