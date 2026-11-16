// “April runs Donna's wedding like a military operation | Parks and Recreation” (the official Parks and Recreation
// channel, Season 7): April plans the wedding as Donna's maid of honor and keeps Donna's grudge-holding family in line
// out of the couple's sight, while a tipsy Ben, egged on by Leslie, gives a toast that drifts into his own marriage.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈255 s. Untested: 3.4 s (“Don's” vs
// “Donna's”), 14–33 s (who has the rage problem; who says “I'm so sorry, Craig”), the family name (captions “Meagles”,
// whisper “Migos”), 94 s (“I said as you were” vs “Hey, status report?”), 109–111 s (Lena Horne: world knowledge),
// 134–158 s (garbled names and a bleeped line), 160–167 s, 198 s (“Roast and toast” vs “Roast it and toast it”),
// 239–255 s (“I approve this message”: world knowledge).
// EAR CHECK: 195.5 s s1 — “You want me to” with no “Do” (both sources start with “You want”)
// REVIEW 2026-11-16: pass 6, fix 16, drop 1, new 0; ear checks 1
// OPEN: who says “nicey-meanie” (102 s) and who separated the two old men (104.6 s)? Whisper's turn marks don't fit
//   Andy then April cleanly; nt2 and d3 no longer depend on it. Who is the planner at 6–33 s (Craig?), likewise.
import type { Clip } from '../types.ts';

export const aprilWedding: Clip = {
  id: 'aprilwedding', video: 'Vh2UEgU2xDc', title: 'April runs Donna\'s wedding like a military operation', dur: 280,
  wpm: 166, band: 'mid', tags: ['友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R drop: i4 (K1 + K6). The “No.” at 13.9 s is another voice (whisper's turn mark), and the planner's line reads as
    //   confident bluster as easily as “it's my first time”; the key was also the only hedged choice. Never shipped.

    // R fix: V2: "names the guests who have caused trouble" rebuilt on the family feuds that follow
    // why: kept apart ← "and Craig" ends it like a list of people, and the feuding family comes next; past weddings ←
    //   "first time" just before
    { id: 'h2', skill: 'humor', level: 'C1', point: 'trigger', seg: [17.66, 30.35],
      stem: 'Why is the list of words to avoid funny?',
      choices: ['It covers almost every word a wedding needs', 'It names the guests who must be kept apart',
                'It lists what went wrong at past weddings'], a: 0,
      cue: '並ぶ語が、どんな場面の言葉か。',
      line: 'Please avoid my *trigger words*: flowers, schedule, vows, bride, groom… *wedding*, and Craig.',
      said: '計画はストレスだと言い、避けてほしい語に花、日程、誓い…結婚式まで並べる。',
      mean: 'trigger words ＝ 怒りの引き金になる語。式の準備で使わずに済む語がない。',
      trap: '最後の Craig が耳に残り人名の一覧に思えるが、ほとんどは式の基本の語。',
      use: 'That’s a trigger word for me.（その言葉、聞くとカッとなる）' },

    // R fix: V2: "flowers and food" was a filler; now the "welcome bags" keyword trap
    // why: welcome ← "welcome bags" and "not welcome" are said; the brother ← "not welcome" is already settled
    { id: 'g1', skill: 'gist', level: 'B2', point: 'drama', reveals: ['tough'], seg: [33.05, 81.8],
      stem: 'Why does Donna most need April this weekend?',
      choices: ['To keep her family’s fights from ruining things', 'To make her family feel welcome all weekend',
                'To keep her brother away from the wedding'], a: 0,
      cue: '家族の話が続く所。drama という語。',
      line: 'which means there’s going to be *drama*.',
      said: '家族は恨みを忘れない人たちで、大勢集まれば必ずもめる。だから強いエイプリルが必要。',
      mean: '式の準備より、親族のもめ事を抑える役を頼んでいる。tough と drama がつながる。',
      trap: 'welcome が2回出るが、頼みは歓迎でなく、もめる家族の管理。',
      use: 'I need you to keep the peace.（場を収めてほしいの）' },

    // why: plans well ← the wedding-planner talk just before; knows the family ← "My family arrives tonight" next
    { id: 'd1', skill: 'detail', level: 'B1', point: 'tough', seg: [34.6, 42.7],
      stem: 'Besides friendship, why did Donna choose April as her maid of honor?',
      choices: ['Because she’s tough', 'Because she plans well', 'Because she knows the family'], a: 0,
      cue: '「But also because」のあと。',
      line: 'But also because *you’re tough*.',
      said: '「親友で、妹みたいに大好きだから。でも、強いからでもある」と言う。',
      mean: 'tough ＝ 強い、手ごわい。家族のもめ事に負けない人が必要。',
      trap: '式の準備の話から計画力と取りやすいが、言っているのは tough。',
      use: 'She’s tough; she can handle it.（彼女は強いから大丈夫）' },

    // anchor: 40.6 s “Ew.” after “I love you like a sister”, set against 57.4–61.0 s “I actually care whether you're
    //   having a good time and are happy. It's weird.”
    // R fix: S4: 26.5 s was over the 25 s cap for a scene-vs-line item; now starts at “because you become” (36.8 s)
    // R fix: V2: "what is she trying not to show" told you a warm feeling was hidden; stem neutral, choices parallel
    // why: honest dislike ← "Ew" taken at its word, as dislike of the sister label; would rather not ← "Ew" heard as a
    //   refusal of the role, though she goes on to promise "I will handle everything"
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'care', seg: [36.8, 61.1],
      stem: 'When April answers the “like a sister” line, how should we read her reply?',
      choices: ['As cover for a fondness she finds awkward', 'As honest dislike of being called family',
                'As a hint she’d rather not be maid of honor'], a: 0,
      cue: '最初の短い反応と、あとの「It’s weird」。',
      line: '…I love you like a sister. — *Ew.* … I *actually care* whether you’re having a good time… *It’s weird*.',
      said: '「妹みたいに大好き」に「うえっ」と返すが、あとで「あなたが楽しいか本気で気にしてる。変な感じ」と言う。',
      mean: '「うえっ」は照れ隠し。あとの「変な感じ」が、自分でも慣れない好意を認めた証拠になる。',
      trap: '言葉どおりだと嫌がっているように聞こえる。あとの本音と並べて、最初の反応を読み直す。',
      use: 'Ugh, don’t make me say it.（もう、言わせないでよ）' },

    // why: 80 ← "80-year-old" comes later in the clip; 18 ← -teen and -ty blur before "Meagles"
    { id: 'n1', skill: 'number', level: 'B1', point: 'count', seg: [47.0, 55.82],
      stem: 'How many of Donna’s relatives will be in one room?',
      choices: ['18', '28', '80'], a: 1, keep: true,
      cue: '「there’s going to be」のすぐあと。',
      line: 'there’s going to be *28* … in one room',
      said: '「それでも、一つの部屋に親族が28人。つまり、もめ事が起きる」と言う。',
      mean: 'twenty-eight は t が弱くなり「トゥエニエイト」とつながる。',
      trap: 'あとで80歳の話が出るので混ざりやすい。eight の前に twenty が付くかを聞く。',
      use: 'There are going to be 28 of us.（28人集まるよ）' },

    // R fix: V2: distractors made parallel ("X, since…") and "proud" turned against "weird"
    // why: annoyed ← "handle everything" heard as a burden; proud ← "actually care" heard as a boast
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'care', seg: [53.6, 61.1],
      stem: 'When April promises to handle everything, how does she feel about caring?',
      choices: ['Surprised at herself, since it’s new to her', 'Annoyed, since Donna expects so much of her',
                'Proud, since caring comes naturally to her'], a: 0,
      cue: '最後の短い2語の文。',
      line: 'I *actually care* whether you’re having a good time and are happy. *It’s weird*.',
      said: '「全部まかせて。あなたが楽しいかどうか本気で気にしてる。変な感じ」と言う。',
      mean: 'It’s weird ＝ 変な感じ。人を気にかける自分に、自分でも慣れていない。',
      trap: 'actually を自慢と取りやすいが、続く weird で戸惑いだと分かる。',
      use: 'I actually miss the office. It’s weird.（会社が恋しい。変な感じ）' },

    // R fix: K6: the key was the only two-part choice ("forget or forgive")
    // why: money ← "wrote her out of his will" comes next; hide feelings ← "cold-blooded" read as 感情を見せない
    { id: 'ph1', skill: 'phrase', level: 'B2', point: 'grudge', seg: [60.95, 65.15],
      stem: 'What does Donna say her family is like?',
      choices: ['They never let go of an old wrong', 'They never stop fighting about money',
                'They never show how they really feel'], a: 0,
      cue: '最後の2語の名詞。',
      line: 'a cold-blooded crew of judgmental *grudge holders*.',
      said: '「うちの家族は冷血で、人を裁く、根に持つ集団」と言う。',
      mean: 'hold a grudge ＝ 恨みを持ち続ける。grudge holders で「根に持つ人たち」。',
      trap: 'cold-blooded から感情を見せない人と取りやすいが、中心は grudge。',
      use: 'He still holds a grudge.（彼はまだ根に持ってる）' },

    // R fix: V2/K5: "Winnie had damaged the table" wasn't about the family; both distractors now are
    // why: money ← "will" heard as the point of the story; neat home ← a coaster suggests house pride
    { id: 'i1', skill: 'infer', level: 'B2', point: 'coaster', reveals: ['grudge'], seg: [64.9, 70.15],
      stem: 'What does the story about cousin Winnie show about the family?',
      choices: ['Small slips can cost you a great deal', 'They take great pride in a neat home',
                'They tend to fight over money and wills'], a: 0,
      cue: '何をしたかと、何をされたかの差。',
      line: 'once *forgot to use a coaster*… and he *wrote her out of his will*.',
      said: 'いとこがコースターを使い忘れただけで、祖父は遺言から彼女を外した。',
      mean: 'write … out of one’s will ＝ 相続人から外す。小さなことに重い罰。',
      trap: 'coaster や will に引かれやすいが、要点は罰の重さ。',
      use: 'Don’t forget to use a coaster.（コースターを使ってね）' },

    // why: 3 ← "no more than three" comes right after; 14 ← -teen heard on "four" before "Meagle"
    { id: 'n2', skill: 'number', level: 'B1', point: 'pictionary', seg: [70.05, 74.2],
      stem: 'How many family Pictionary tournaments ended at the hospital?',
      choices: ['3', '4', '14'], a: 1, keep: true,
      cue: '「The last」のすぐあと。',
      line: 'The last *four* … family Pictionary tournaments ended at the hospital.',
      said: '「最近4回の家族お絵かき大会は、全部病院で終わった」。',
      mean: 'four は短く1音節。the last four ＝ 直近の4回。',
      trap: 'すぐあとに three が出るので混ざりやすい。last のすぐあとの数を聞く。',
      use: 'The last four games ended in a tie.（最近4試合は引き分け）' },

    // R fix: V2: the key read as the punchline ("keeps them for the presents"); now plain
    // why: flatware for April ← "Got to get that flatware" heard as a request; gifts start fights ← "gifts" pulled
    //   into the list of fights
    { id: 'h3', skill: 'humor', level: 'C1', point: 'gifts', reveals: ['pictionary'], seg: [70.05, 81.8],
      stem: 'Why does Donna’s last point about her family get a laugh?',
      choices: ['Her one good word for them is about gifts', 'She hints that April should buy her flatware',
                'She admits that gifts are what start the fights'], a: 0,
      cue: '「But」のあと。それまでの話との落差。',
      line: 'But they *give great gifts*. Got to get that flatware.',
      said: '病院送りや飛行機の人数制限まで話したあと、「でも贈り物はすごい。食器がほしい」と言う。',
      mean: 'ひどい話を並べた最後に、呼ぶ理由がプレゼントだと明かす。その落差が笑い。',
      trap: 'Got to get を頼みごとと取りやすいが、自分がほしいという独り言。',
      use: 'But hey, the food is great.（でもまあ、料理は最高）' },

    // R fix: V2: "unsure, as it was so long ago" was weak; now a let-it-go reading of the sarcasm
    // why: agree ← "I'm sure… an accident" taken at its word; no longer matters ← the joking tone heard as letting go
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'digdug', seg: [82.4, 94.0],
      stem: 'When someone says it was probably an accident, how does the reply sound?',
      choices: ['Certain it was done on purpose', 'Ready to agree it was an accident',
                'Joking that it no longer matters'], a: 0,
      cue: '「I’m sure」のあと、ありえる話かどうか。',
      line: 'Oh, yeah, *I’m sure* the Dig Dug machine *just unplugged itself*…',
      said: '「ああ、ゲーム機が勝手に抜けたんだろうね。ハイスコア直前に」と言う。',
      mean: 'I’m sure … just ～ itself は皮肉。勝手に抜けるはずがない、わざとだと言う。',
      trap: 'I’m sure を同意と取りやすい。ありえない話が続けば逆の意味。',
      use: 'Oh sure, the dog ate your homework.（はいはい、犬が宿題を食べたのね）' },

    // anchor: 96.4–100.3 s “sound passive, but seem aggressive”: the two halves of “passive-aggressive”, which Joe
    //   says outright at 128.1 s (“no passive-aggressive comments”)
    // R fix: S1/N7: the stem named Andy, but the turns at 94–112 s don't settle the speaker; now speaker-neutral
    // why: the family ← right mechanism, wrong target: they are what is described, not what's laughed at; the couple
    //   ← "no passive-aggressive comments" later, as if they were the ones fooled
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'nicey', seg: [95.1, 104.4],
      stem: 'In the “nicey-meanie” line, who is the joke on?',
      choices: ['The speaker, who misses a word just half said', 'The family, for being so two-faced to all',
                'The couple, for missing all the trouble'], a: 0,
      cue: 'その前の文の、2つの形容詞。',
      line: 'The words that they say sound *passive*, but seem *aggressive*. … Like, *nicey-meanie*.',
      said: '「言葉は受け身っぽいのに攻撃的。呼び名があるはず。ナイシー・ミーニーとか」と言う。',
      mean: '答えは passive-aggressive で、本人が2語とも言っている。笑われているのは、言葉を作ろうとする話し手。',
      trap: '親族の悪口に聞こえるが、自分で言った語に気づかない話し手がおかしい。',
      use: 'There’s a word for that, you know.（それ、ちゃんと言葉があるよ）' },

    // R fix: S1: the stem named April, but the speaker isn't settled by the words (see OPEN)
    // why: a singer ← "whether it was really Lena Horne" is what they argued about; grocery bill ← "grocery store"
    { id: 'd3', skill: 'detail', level: 'B1', point: 'separate', seg: [104.3, 112.4],
      stem: 'In the reply to the “nicey-meanie” line, what did the speaker just do?',
      choices: ['Pull apart two old men who were arguing', 'Find out if a singer was really in a store',
                'Settle a fight over a grocery store bill'], a: 0,
      cue: '「I just had to」のあとの動詞。',
      line: 'I just had to *physically separate two 80-year-old men*…',
      said: '「80歳の男2人を引き離したところ。昔の事でもめてた」と言う。',
      mean: 'physically separate ＝ 体で間に入って引き離す。もめる理由がとても古くて小さい。',
      trap: '歌手や店の話は、もめた中身。話し手がしたことは had to のあと。',
      use: 'I had to separate the kids.（子どもたちを引き離さなきゃいけなかった）' },

    // R fix: V2/K6: the key was the only choice naming people who act; distractors rebuilt in parallel
    // why: best behavior ← "No drama at all" taken as the family's doing; polite ← "you are an angel for asking" heard
    //   as a courtesy (社交辞令)
    { id: 'i2', skill: 'infer', level: 'C1', point: 'hidden', seg: [119.45, 134.3],
      stem: 'What explains the couple’s sense that there has been no drama?',
      choices: ['Others are handling the trouble out of sight', 'The family is on its best behavior for them',
                'They’re just being polite to the planner'], a: 0,
      cue: '二人の言葉の直後に、誰が何を連れてくるか。',
      line: 'No drama at all. — *Here are all the troublemakers, boss*.',
      said: '新郎新婦は「全然大変じゃない、もめ事ゼロ」と喜ぶ。直後、アンディが「問題児を連れてきました」。',
      mean: 'もめ事がないのではなく、二人に見えない所で片付けている。場面のつなぎが答え。',
      trap: '二人の言葉だけで決めない。直後の場面が、その言葉を裏から説明している。',
      use: 'It went smoothly, thanks to you.（あなたのおかげで順調だった）' },

    // why: ruining ← "killing" taken literally; drinking ← "drunk" comes a few lines later
    { id: 'ph2', skill: 'phrase', level: 'B2', point: 'killing', seg: [168.3, 172.0],
      stem: 'What does Leslie tell Ben at the start of their talk?',
      choices: ['He is doing a great job', 'He is ruining the party', 'He is drinking too much'], a: 0,
      cue: '「Babe」のあと。彼の返事も手がかり。',
      line: 'Babe, you are *killing it*. — I am, right?',
      said: '「あなた、最高にうまくやってる」と言い、彼も「だろ？」と返す。',
      mean: 'kill it ＝ すごくうまくやる。口語のほめ言葉。',
      trap: 'kill を文字どおり取ると悪い意味に聞こえる。返事の I am, right? でほめ言葉と分かる。',
      use: 'You killed it up there!（ステージ、最高だったよ）' },

    // R fix: K6: the key was the only two-part choice
    // why: elected ← "congressman" heard as a fact; the guests ← "makes me feel like one" heard as how others see him
    { id: 'i3', skill: 'infer', level: 'B2', point: 'congress', seg: [170.35, 175.6],
      stem: 'What does Ben’s line about feeling like a congressman suggest?',
      choices: ['He’s only picturing himself in the role', 'He has just been elected to Congress',
                'The guests keep treating him like one'], a: 0,
      cue: '「See,」のあとの2語。',
      line: '*just thinking* I’m a congressman makes me feel like one.',
      said: '「議員だと思うだけで、議員の気分になる」と言う。',
      mean: 'just thinking ＝ そう思うだけで。まだ議員ではなく、その気になっている段階。',
      trap: 'congressman だけ聞くと本物に聞こえる。just thinking が「想像」の合図。',
      use: 'Just thinking about it makes me hungry.（考えるだけでお腹がすく）' },

    // why: a glass ← "one" heard, then the usual unit of wine; a bottle ← "wine" plus "drunk"
    { id: 'n3', skill: 'number', level: 'B1', point: 'sip', seg: [179.3, 183.38],
      stem: 'Since having kids, how much wine does it take to make her drunk?',
      choices: ['one sip', 'one glass', 'one bottle'], a: 0, keep: true,
      cue: '「only takes, like, one」のあと。',
      line: 'it only takes, like, *one sip* of wine.',
      said: '「私も酔ってる。子どもができてから、ワイン一口で酔うの」と言う。',
      mean: 'sip ＝ ひと口。only takes ＝ それだけで足りる。',
      trap: 'one だけ聞くと一杯と思いやすい。one のあとの短い語を聞く。',
      use: 'Just a sip, please.（ひと口だけちょうだい）' },

    // R fix: V2/K7: the key was the longest; stem made speaker-neutral (the turns at 179–188 s are only whisper's marks)
    // why: fancy word ← the made-up sound heard as on purpose; asks for help ← the restart "Con—" heard as a search
    { id: 'h6', skill: 'humor', level: 'C1', point: 'condifent', seg: [179.3, 189.6],
      stem: 'Why does the “I feel so good and…” moment get a laugh?',
      choices: ['The speaker botches “confident” while claiming it', 'The speaker makes up a word to sound like a politician',
                'The speaker loses the word and asks the other for help'], a: 0,
      cue: '「so good and」のあとの語と、言い直し。',
      line: 'I feel so good and *condifent*. … Con— I feel *condifent*.',
      said: '「すごくいい気分で、じしんまんまん」と言い間違え、言い直してもまた同じ。',
      mean: '酔って confident の音が入れかわる。「自信がある」と言う語でつまずく皮肉が笑い。',
      trap: 'Con— で言い直すので言葉を探しているようだが、助けは求めていない。',
      use: 'Sorry, I’m tongue-tied today.（ごめん、今日はうまく話せない）' },

    // R fix: V2: "warns him not to speak drunk" was refuted by "You should"; now a duty reading of "you have to"
    // why: duty ← "you have to give speeches" heard as his obligation tonight; announce ← "running for Congress" heard
    //   without its "if"
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'toast', reveals: ['congress'], seg: [189.35, 195.45],
      stem: 'What does Leslie’s reason for the toast do?',
      choices: ['Sells it as practice for a run for Congress', 'Reminds him that a toast is his duty today',
                'Asks him to tell everyone he is running'], a: 0,
      cue: '「Because」のあと、if の形。',
      line: 'You should give a toast. Because *if you were running for Congress*, you have to give speeches, right?',
      said: '「あいさつしたら？ 議員ならスピーチは要るでしょ」と勧める。',
      mean: 'if you were running ＝ もし出馬するなら。あいさつを選挙の練習として勧める。',
      trap: '出馬の発表と取りやすいが、if の付いた仮の話。',
      use: 'You should try it. It’s good practice.（やってみたら？いい練習になるよ）' },

    // EAR CHECK: s1
    // why: Do you ← the textbook question form, so a "Do" gets added; wanted ← a d imagined before "me"; want to ←
    //   the short "me" lost between "want" and "to"
    { id: 's1', skill: 'sound', level: 'B2', point: 'wantme', seg: [193.85, 197.3],
      stem: 'Fill the gap: “___ make a toast?”',
      choices: ['You want me to', 'Do you want me to', 'You wanted me to', 'You want to'], a: 0,
      cue: '文の最初の音と、want のあとの短い音。',
      line: '*You want me to* make a toast? I’ll toast it up.',
      said: '「乾杯のあいさつ、ぼくがやるの？ やるよ」と聞き返す。',
      mean: '会話では Do を落とし、You want me to? と上げ調子で聞く。me to は「ミタ」と短い。',
      trap: 'Do があるはずと思うと、ない音を足しやすい。文頭が「ユ」で始まるかを聞く。',
      use: 'You want me to drive?（ぼくが運転しようか？）' },

    // R fix: ear check removed: both sources have “till it's brown”, and the item asks for the words, not the s
    { id: 'x1', skill: 'dict', level: 'B2', point: 'brown', seg: [196.4, 200.6],
      stem: 'Type the gap: “toast it ___ on both sides.” (3 words)', answer: "till it's brown",
      cue: '「toast it」のあと、brown までの短い音。',
      line: 'toast it *till it’s brown* on both sides.',
      said: '「両面こんがり、きつね色になるまで焼いちゃって」とけしかける。',
      mean: 'till it’s がつながり「ティリッツ」。till は until の短い形。',
      trap: 'it’s の s が弱く till it に聞こえやすい。brown の前の小さな音を拾う。',
      use: 'Cook it till it’s golden.（きつね色になるまで焼いて）' },

    // R fix: K1: "why he should be voted for" was half true (the closing “I approve this message”); now advice
    // why: how they met ← the couple's names open the toast; advice ← "every day you come home" heard as the usual
    //   newlywed tip of a toast
    { id: 'g2', skill: 'gist', level: 'B2', point: 'speech', seg: [200.6, 243.7],
      stem: 'Where does Ben’s toast go after he starts with the couple?',
      choices: ['Into his own married life with Leslie', 'Into how Donna and Joe first met',
                'Into advice for the couple’s first year'], a: 0,
      cue: '「every day you come home」のあと、誰の話か。',
      line: 'every day you come home and you’re just like, “What? It’s you. I love you.” — He’s *talking about me*.',
      said: '二人を祝うと言いつつ、「家に帰ると君がいる、愛してる」と自分の話になり、妻が「私のこと！」と喜ぶ。',
      mean: '結婚のすばらしさの例に、自分の家庭を語りだす。酔って話がそれていく。',
      trap: '新婚への助言に聞こえるが、妻の「私のことよ」で自分の話と分かる。',
      use: 'Here’s to the happy couple!（お二人の幸せに乾杯！）' },
  ]
};
