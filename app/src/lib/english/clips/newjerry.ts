// REVIEW 2026-11-16: pass 7, fix 16, drop 1, new 0; ear checks 2
// OPEN: i1 rests on hearing “a Jerry you don't have to pay”, though both sources write “jury”; if the ear says
//   “jury”, drop i1 (d1 still covers the pitch)
// “Ron Swanson Saves Tom's Swagger | Parks and Recreation” (the official Parks and Recreation channel, Season 5): with
// Jerry gone, the office hunts for a new person to tease, a stumble over words makes it Tom, his intern plan fails, and
// Ron brings Jerry back once a week.
// Segments from the captions, words from whisper (2026-11-16). The captions garble names ("Eddie Hayes" for Andy,
// "jury" for Jerry at 142.9 s) and miss 59.7–65.9 s; no key rests on those stretches. Whisper's timings drift after
// 60 s, so every segment is from the captions. Skipped on purpose: April's opening ("making out"), Donna and Taylor at
// 154–161 s (innuendo), and who says "Barking up the wrong tree" (stems leave the speaker out).
// EAR CHECK: 142.9 s i1 — both sources write “It's like a jury you don't have to pay”; the key reads it as “a Jerry”
// EAR CHECK: 200.2 s p1 h2 — whisper “Ask me if I'm sad”, captions “asked me if I'm sad”; both items need “Ask me”
import type { Clip } from '../types.ts';

export const tomSwagger: Clip = {
  id: 'newjerry', video: '-bmfy_Vj7Ng', title: 'Ron Swanson Saves Tom’s Swagger', dur: 299, wpm: 165,
  band: 'slow',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %): "cover his work" was a filler; the near miss is now the reply's "one of you will be
    //   ridiculed", heard as the reason for the sad day
    // why: friend ← "a sad day" read as real grief over a colleague leaving (the farewell script); next ← "Soon, one of
    //   you will be ridiculed" comes right after, but it answers the worry; "Who are we gonna make fun of now?" settles it
    { id: 'g1', skill: 'gist', level: 'B1', point: 'sadday', seg: [7.3, 30.5],
      stem: 'Why is it “a sad day” for the coworkers?',
      choices: ['They’ve lost the one they all teased', 'One of them will now be teased instead', 'They lost a friend they’ll all miss'], a: 0,
      cue: 'sad day のすぐあと、疑問文の最後の部分。',
      line: 'This is a sad day. Who are we gonna *make fun of* now?',
      said: '「悲しい日だ。誰をからかえばいい？」と言い、「すぐ次が決まる」と返される。',
      mean: '悲しいのは別れではなく、いじる相手がいなくなったこと。',
      trap: 'sad day だけで送別と取りやすい。次にいじられる話は、その心配への返事。',
      use: 'Who are we going to blame now?（今度は誰のせいにする？）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'spill', seg: [37.1, 42.05],
      stem: 'Type the reply to “What are you doing?”: “Just ___ spill anything.” (3 words)', answer: 'trying not to',
      cue: 'Just のすぐあと、spill の前まで。',
      line: 'Just *trying not to* spill anything.',
      said: '「何かこぼさないようにしてるだけ」。trying not to は「トライン・ナッタ」。',
      mean: 'not to の t が弾み、to は「タ」と弱くなる。',
      trap: 'not と to が一つに聞こえ、trying to と取りやすい。not は短くても残る。',
      use: 'I’m trying not to laugh.（笑わないようにしてるの）' },

    // why: 13 ← -teen/-ty: "thirty" with a flapped t and weak -ty sounds like "thirteen"; 3 ← "thirty" cut short to
    //   "three", an "it starts small" reading
    { id: 'n1', skill: 'number', level: 'B1', point: 'thirty', seg: [65.4, 77.8], keep: true,
      stem: 'In Tom’s picture of his future, how many years later is it?',
      choices: ['3 years', '13 years', '30 years'], a: 2,
      cue: 'sentence のすぐあと、later の前の数。',
      line: 'One screwed-up sentence. And *30 years later*…',
      said: '「言葉のつまずき一つで、30年後には…」と未来を思い描く。',
      mean: 'thirty は前が強く、ty は短い。thirteen は teen が強く長い。',
      trap: 'thirty の t が弾んで「サーディ」になり、thirteen と混ざりやすい。強い所で判断。',
      use: 'Ten years from now, who knows?（10年後なんて、誰にも分からない）' },

    // R fix: V2 (blind 60 %): both distractors contradicted the dread; now a present-tense misreading and a blame reading
    // why: already ← "I'm wearing… listening…" heard as the present, a self-reveal joke, but "30 years later" frames it;
    //   blame ← "the office selects a new Jerry" earlier; he blames one sentence, not the others
    { id: 'h3', skill: 'humor', level: 'C1', point: 'future', seg: [65.4, 77.8],
      stem: 'What makes Tom’s talk to the camera about his future funny?',
      choices: ['He leaps from one slip to a whole dull future', 'He admits he already dresses and lives that way',
                'He blames the others for the life he’ll end up in'], a: 0,
      cue: '最初の短い文と、そのあと長く続く品物の列。',
      line: 'One screwed-up sentence. And… I’m wearing *aquamarine sweater vests*…',
      said: '一度の言いそこないから、ダサいベストに古い音楽という未来まで一気に想像する。',
      mean: '小さな失敗から大げさな未来へ飛ぶ落差が笑い。',
      trap: 'I’m wearing を今の話と取りやすいが、This is how it begins から先は未来の想像。',
      use: 'This is how it starts.（こうやって始まるんだよ）' },

    // R fix: V2 (blind 50 %): "his choice" pointed at a wrong pick; the stem is now neutral and the distractors are the
    //   literal "bark" (noise) and "Game over" (spoke too soon)
    // why: noise ← "barking" read literally as making a fuss; too soon ← "Game over" right before makes it sound like a
    //   rushed call; "Andy will never be the new Jerry" settles that the target itself is wrong
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'wrongtree', seg: [104.7, 113.1],
      stem: 'After Andy’s squid joke, what is Tom told?',
      choices: ['He has picked the wrong target', 'He is making too much fuss about it', 'He has called it over too soon'], a: 0,
      cue: 'Philo と呼ぶ直前、木に関する言い方。',
      line: '*Barking up the wrong tree*, Philo.',
      said: '「見当違いだ」と言い、Andy は新しい Jerry にならないと続ける。',
      mean: '狙う相手を間違える、という決まり文句。犬が違う木に吠える姿から。',
      trap: 'barking を「騒ぐ」と文字通り取りやすい。次の never で、相手選びが違うと分かる。',
      use: 'You’re barking up the wrong tree.（お門違いだよ）' },

    // R fix: V2 (blind 50 %): the key was the only choice about embarrassment; a distractor now misreads the same words
    // why: liked ← "giant puppy" heard as cute and loved; never does ← "Nothing embarrasses him" read as "he never does
    //   anything embarrassing", right after his ink-Dracula act; "with no shame" settles that he feels none
    { id: 'i3', skill: 'infer', level: 'B2', point: 'andy', reveals: ['wrongtree'], seg: [104.7, 113.1],
      stem: 'Why does Tom’s pick fail, according to the reply?',
      choices: ['Teasing never makes him feel ashamed', 'Everyone likes him too much to tease', 'He never does anything embarrassing'], a: 0,
      cue: 'never の文のあと、短い理由の文。',
      line: 'Andy will never be the new Jerry. *Nothing embarrasses him.*',
      said: '「Andy は新しい Jerry にならない。何をされても恥ずかしがらない」。',
      mean: 'からかいは相手が恥ずかしがって初めて成り立つ。',
      trap: '「恥ずかしいことをしない」と取りやすい。主語は Nothing で、何をされても恥ずかしく感じない、の意味。',
      use: 'Nothing embarrasses her.（彼女は何があっても動じない）' },

    // C2 dict: four weak words that run into one ("whatchaneedis") at native speed
    // anchor: 113.1–114.0 s "what you need is" (both sources), unstressed before the stressed "fresh meat"
    { id: 'nt3', skill: 'dict', level: 'C2', point: 'freshmeat', seg: [110.8, 115.8],
      stem: 'Type the start: “___ some fresh meat in the office.” (4 words)', answer: 'what you need is',
      cue: 'puppy の文のあと、fresh の前まで。弱い語も全部。',
      line: '*What you need is* some fresh meat in the office.',
      said: '「必要なのは職場の新しい獲物だ」。4語が「ワチュニーディズ」と一続き。',
      mean: 'what you が「ワチュ」になり、need is もつながる。強いのは fresh meat だけ。',
      trap: '文法から You need… と書きがち。弱い what と is も聞こえたまま書く。',
      use: 'What you need is a good night’s sleep.（必要なのはぐっすり眠ること）' },

    // R fix: V2 (blind 55 %): "couldn't just" and "would just" don't fit the sentence; now could/can/should, all
    //   grammatical, with "can" the near sound
    // why: can ← "could" weakens to "kəd", close to "kən", and both make a suggestion; should ← same meaning, only the
    //   first sound /k/ vs /ʃ/ decides
    { id: 's1', skill: 'sound', level: 'B2', point: 'couldjust', seg: [111.0, 118.9],
      stem: 'Fill the gap: “Or you guys ___ stop making fun of me.”',
      choices: ['could just', 'can just', 'should just'], a: 0,
      cue: 'you guys のすぐあと、とても短い2語。',
      line: 'Or you guys *could just* stop making fun of me.',
      said: '「それか、からかうのをやめればいいだけだろ」と言う。',
      mean: 'could は「クd」と弱く just とつながる。提案の形の「やめてくれ」。',
      trap: 'can なら n が残り「クン」になる。should とは最初の音（ク／シュ）で聞き分ける。',
      use: 'You could just ask me.（普通に聞いてくれればいいのに）' },

    // why: ease tension ← slack = ゆるみ, "pick up" heard as cheering up; files ← the dropped files earlier and "pick up"
    //   read literally; "now that Jerry's gone… hire someone" ties it to the work
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'slack', seg: [125.4, 133.3],
      stem: 'What does Tom say a new hire would need to do?',
      choices: ['Take on the work Jerry left', 'Ease the tension in the office', 'Pick up the files Jerry dropped'], a: 0,
      cue: 'Jerry’s gone のあと、hire someone に続く言い方。',
      line: 'now that Jerry’s gone, we need to hire someone to *pick up the slack*',
      said: '「Jerry が抜けたから、穴を埋める人を雇わないと」と言う。',
      mean: 'pick up the slack ＝ 抜けた人の分の仕事を引き受ける。',
      trap: 'pick up を「拾う」、slack を「ゆるみ」と一語ずつ取ると別の意味。まとめて覚える。',
      use: 'Can you pick up the slack this week?（今週、穴を埋めてくれる？）' },

    // R fix: V2 (blind 65 %): "forgets the word" was a filler; now "a kid, not an adult", a literal reading of "not a person"
    // why: part-time ← "not a person" heard as "not a full person" = less than full-time; kid ← "not a person" heard as
    //   "not a grown-up", since interns are young; "Not a person. An intern." sets intern against person, nothing else
    { id: 'h1', skill: 'humor', level: 'C1', point: 'notperson', seg: [125.4, 133.3],
      stem: 'Why is Tom’s correction after “A new person in the office?” funny?',
      choices: ['He talks as if interns aren’t real people', 'He means the hire would only be part-time',
                'He means a kid, not a grown adult'], a: 0,
      cue: 'Ron の質問への、短い二つの返事。',
      line: 'A new person in the office? — *Not a person. An intern.*',
      said: '「新しい人？」と聞かれ、「人じゃない。インターンだ」と言い直す。',
      mean: 'インターンを人数に入れない言い方。インターンは人以下、という失礼な見方が笑い。',
      trap: '「人じゃない」を「大人じゃない」と取りやすいが、ここは「人」か「インターン」かの区別そのもの。',
      use: 'Not a vacation. A work trip.（休暇じゃない。出張だよ）' },

    // why: cheap/hard-working ← the usual case for interns (the script); learn fast ← "cost nothing" heard right, the
    //   second half filled in with the usual praise; "stupid and terrible, so they get no work done" settles it
    { id: 'd1', skill: 'detail', level: 'B1', point: 'whyintern', seg: [133.1, 143.7],
      stem: 'What two reasons does Tom give Ron for an intern?',
      choices: ['They’re free, and they get nothing done', 'They’re cheap, and they work very hard',
                'They’re free, and they learn the job fast'], a: 0,
      cue: 'importantly のあと、so で終わる部分。',
      line: 'Interns *cost nothing*… they’re usually stupid and terrible, so they *get no work done*.',
      said: '「インターンは税金がかからない。しかも大抵ダメだから、仕事が進まない」。',
      mean: '仕事が進まないことを長所として挙げている。政府嫌いの Ron に向けた売り込み。',
      trap: 'インターンをほめる話だと思うと「よく働く」を選びやすい。so のあとの結果を聞く。',
      use: 'More importantly, it’s free.（もっと大事なのは、タダってこと）' },

    // R fix: V2 (blind 60 %): two "work" distractors left the key as the odd one out; "files" is now "take the blame for
    //   slow work", a wrong implication of "no work done"
    // why: Jerry's work ← his opening "pick up the slack" taken at face value; blame ← "they get no work done" heard as a
    //   handy excuse; "like a Jerry you don't have to pay" names the role
    // retired: the ear-check policy: the key reads “a Jerry”, both sources write “jury” (142.9 s); back if the ear says Jerry
    { id: 'i1', skill: 'infer', level: 'C1', point: 'jerrypay', reveals: ['whyintern'], seg: [133.1, 146.2], retired: true,
      stem: 'From Tom’s pitch, what would an intern mainly be for?',
      choices: ['Someone to be the new office joke', 'Someone to finish Jerry’s old work', 'Someone to blame when work is slow'], a: 0,
      cue: '最後の It’s like… のたとえ。',
      line: 'they get no work done. It’s like *a Jerry you don’t have to pay*.',
      said: '「仕事はしない。給料のいらない Jerry みたいなもの」。',
      mean: 'Jerry ＝ いじられ役。自分の代わりにからかわれる人がほしい。',
      trap: '最初の「穴を埋める」を信じやすい。no work done の時点で仕事のためではない。',
      use: 'It’s like a gym you never have to go to.（行かなくていいジムみたいなもの）' },

    // why: amused ← "Damn, son" heard as a joke reaction; annoyed ← "no work done" sounds like laziness Ron would hate;
    //   "That is one compelling argument… we may destroy this government one day after all" is real praise
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'damnson', seg: [140.9, 151.0],
      stem: 'How does Ron feel about Tom’s case for an intern?',
      choices: ['Genuinely won over by it', 'Amused, but not convinced', 'Annoyed by how lazy it is'], a: 0,
      cue: 'Damn, son のあと、argument と government の部分。',
      line: '*Damn, son.* That is one *compelling argument*… We may destroy this government one day after all.',
      said: '「やるな。説得力がある。いつか政府をつぶせるかもな」。',
      mean: '政府が小さくなるのが Ron の望み。仕事が進まないのは本気でほめる理由。',
      trap: 'Damn は悪口に聞こえるが感心の声。皮肉なら keep it up と後押しはしない。',
      use: 'That’s a pretty compelling argument.（なかなか説得力があるね）' },

    // R fix: V2 (blind 55 %): the key was the only choice where Tom wants to talk; "hiding hurt" is now "teasing Ron for
    //   never asking", a sarcastic reading of the same request
    // why: test ← "Ask me…" heard as setting up a quiz; teasing ← an order to ask heard as a dig at Ron's coldness;
    //   "I'm the new Jerry", said straight right after, shows he wants Ron to ask so he can pour it out
    // retired: the ear-check policy: the key needs “Ask me” (whisper), the captions have “asked me” (200.2 s)
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'askme', seg: [198.2, 202.6], retired: true,
      stem: 'When Tom tells Ron what to ask him, what is he doing?',
      choices: ['Getting Ron to ask so he can vent', 'Testing whether Ron is listening', 'Teasing Ron for never asking about him'], a: 0,
      cue: 'Ron と呼んだあと、自分について聞いてほしい事。',
      line: 'Ron? *Ask me if I’m sad.*',
      said: '「Ron、俺が悲しいかって聞いてよ」と自分から頼む。',
      mean: '聞いてもらって愚痴を言いたい。慰めてほしいという遠回しなお願い。',
      trap: 'Ask me は命令形なので試験のように聞こえるが、自分の気持ちを話すきっかけ作り。',
      use: 'Ask me how my day was.（今日どうだったか聞いてよ）' },

    // R fix: V2 (blind 60 %): "wasn't listening" was a filler; now "cuts Tom off", and the key no longer says "simply"
    // why: Tom not sad ← "No" heard as the answer to "am I sad?"; cuts off ← a fast one-word reply heard as an
    //   interruption, but Tom has finished; the request was to ask, and "No" refuses the request
    // retired: the ear-check policy: the key needs “Ask me” (whisper), the captions have “asked me” (200.2 s)
    { id: 'h2', skill: 'humor', level: 'C1', point: 'askme', seg: [198.2, 202.6], retired: true,
      stem: 'Why is Ron’s one-word reply funny?',
      choices: ['He turns down the request itself', 'He answers for Tom that he isn’t sad', 'He cuts Tom off before he can finish'], a: 0,
      cue: '頼みの内容と、返事が何に答えているか。',
      line: 'Ask me if I’m sad. — *No.*',
      said: '「悲しいか聞いて」と頼まれ、Ron は「いやだ」の一言で返す。',
      mean: 'No は「聞かない」という断り。慰めの場面を一言で切るそっけなさが笑い。',
      trap: 'No を「君は悲しくない」という答えと取りやすい。頼まれたのは聞くこと。何への No かを考える。',
      use: 'Can I vent for a minute? — No.（ちょっと愚痴っていい？—だめ）' },

    // R fix: V2 (blind 60 %): "Coldly: earned it" was weak; now a near miss that shares "Bluntly: stop complaining" and
    //   differs only in the push ("accept it" vs "fight back")
    // why: gently ← "Ask me if I'm sad" just before, so a kind question seems due; accept ← "is whining gonna do anything"
    //   heard as "nothing can be done"; "Stand up for yourself" is a push to fight back
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'whining', seg: [202.5, 211.0],
      stem: 'How does Ron answer when Tom says he’s the new Jerry?',
      choices: ['Bluntly: stop complaining and fight back', 'Gently: he asks Tom why he feels sad',
                'Bluntly: stop complaining and accept it'], a: 0,
      cue: 'whining のある疑問文と、最後の命令文。',
      line: '…*whining* gonna do anything about it? … *Stand up for yourself.*',
      said: '「泣き言で何か変わるか？やられ役になりたくないなら、立ち向かえ」と言う。',
      mean: '慰めはしないが、見捨ててもいない。Ron なりの厳しい励まし。',
      trap: '最初の疑問文を「どうにもならない」と取りやすい。最後の命令文が、言い返せというひと押し。',
      use: 'Stand up for yourself.（自分のために言い返しなよ）' },

    // why: 2 ← "twelve" heard without its first sound as "two" plus "years"; 20 ← twelve/twenty, both start "tw"
    { id: 'n2', skill: 'number', level: 'B1', point: 'twelve', seg: [213.2, 219.95], keep: true,
      stem: 'How long did it take Tom to reinvent himself?',
      choices: ['2 years', '12 years', '20 years'], a: 1,
      cue: 'it sucked のあと、took me に続く数。',
      line: 'It took me *12 years*, but I reinvented myself.',
      said: '「12年かかったけど、自分を作り変えた」と話す。',
      mean: 'いじられた子ども時代から、長い時間で今の自分になった。',
      trap: 'twelve と twenty は最初が同じ。twelve は lv で短く終わり、twenty は ty が付く。',
      use: 'It took me two years to save up.（貯めるのに2年かかった）' },

    // R fix: V2 (blind 60 %): "show he doesn't care" was weak; now "blend in", a wrong reading of "lean into it"
    // why: cheer up ← shopping after a bad day is the usual comfort script; blend in ← "lean into it" heard as fitting in
    //   quietly; "Back to being a Jerry… might as well" gives up and goes all in
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'leaninto', seg: [221.5, 233.7],
      stem: 'Why does Tom plan to buy sweatpants and a Nicholas Sparks novel?',
      choices: ['To go all in on being the Jerry', 'To cheer himself up after a bad day',
                'To blend in so they’ll leave him alone'], a: 0,
      cue: 'novel の文のあと、最後の短い一言。',
      line: 'Back to being a Jerry… might as well *lean into it*.',
      said: '「また Jerry に逆戻り。どうせなら、とことんそれらしく」。',
      mean: 'lean into it ＝ 避けられないことを、むしろ進んで受け入れる。',
      trap: '買い物は気晴らしと取りやすい。might as well（どうせなら）が「あきらめて乗る」合図。',
      use: 'It’s raining, so let’s lean into it.（雨だし、いっそ楽しもう）' },

    // C2 humor: who the joke is on, and how a self-correction lands
    // anchor: 234.1–242.1 s "He's a grown man. Well, half grown." then "he rents out his clothes to twelve-year-olds":
    //   the subject is "he" throughout, and kid-sized clothes prove the dig
    // R fix: V2 (blind 55 %): the kids distractor was weak; it is now a fond joke that backs up the praise, the near miss
    //   a fluent non-native picks
    // why: worry ← "half grown" heard as "too young", but he opens with "Tom can take care of himself"; fond ← a light
    //   tone heard as support, yet "Well, half" lowers "grown man" and the clothes line proves the dig
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'grown', seg: [233.6, 242.3],
      stem: 'To the camera, how does Ron’s “Well, half grown” land?',
      choices: ['As a dig that half takes back his praise', 'As a worry that Tom is too young for this',
                'As a fond joke that backs up his praise'], a: 0,
      cue: 'grown man の直後の言い直しと、そのあとの証拠。',
      line: 'He’s a *grown man*. Well, *half grown*.',
      said: '「Tom は大人だ。まあ半分な。12歳に服を貸す商売をしている」と言う。',
      mean: '自分の言葉をすぐ半分取り消す形のからかい。服が子どもに合う＝体も中身も子どもっぽい、という落ち。',
      trap: '軽い言い方なので味方の冗談と取りやすい。Well, half は直前のほめ言葉を下げる合図。',
      use: 'She’s an expert. Well, sort of.（彼女は専門家。まあ、一応ね）' },

    // R fix: V2 (blind 50 %): "quit to try something new" was weak; now "quit; wasn't fired", sharing the key's second half
    // why: fired ← fired/retired share "-ired", and "fired" comes first; quit ← "wasn't fired" heard right, but "retired"
    //   swapped for the commoner "quit"; "I wasn't fired. I retired." settles it
    { id: 'd2', skill: 'detail', level: 'B1', point: 'fired', seg: [243.8, 250.6],
      stem: 'What does Jerry say about how he left his job?',
      choices: ['He retired; he wasn’t fired', 'He was fired; he didn’t retire', 'He quit; he wasn’t fired'], a: 0,
      cue: '最初の否定文と、そのあとの短い文。',
      line: 'I *wasn’t fired*. I *retired*.',
      said: '「クビじゃない。退職したんだ」と言うが、「みんなそう言う」と返される。',
      mean: 'retire ＝ 定年などで仕事を辞める。fire ＝ 解雇する。',
      trap: 'fired と retired は語尾が同じ。最初の wasn’t の否定と、re の音で聞き分ける。',
      use: 'I didn’t quit. I was let go.（辞めたんじゃない、切られたの）' },

    // R fix: V2 (blind 65 %): "stop the teasing" was weak; now "gives Jerry his old job back", the near miss that
    //   "a couple hours a week until we find a permanent replacement" refutes
    // why: new intern ← Tom's own plan earlier (an intern to tease), and Ron says the intern "wasn't working out";
    //   old job ← "I asked Jerry to come in" heard as rehiring him; it is a few hours a week, until a replacement
    { id: 'g2', skill: 'gist', level: 'B2', point: 'fix', reveals: ['hearing'], seg: [243.8, 288.4],
      stem: 'In the end, how does Ron deal with Tom’s problem?',
      choices: ['He has Jerry drop in once a week', 'He hires another intern to be teased', 'He gives Jerry his old job back'], a: 0,
      cue: '最後に戻ってきた人と、来る時間の長さ。',
      said: 'インターンは辞めさせ、Jerry を週に一度呼び戻す。',
      mean: 'いじられ役を Jerry に戻して、Tom を「新しい Jerry」から外している。',
      trap: 'Jerry が戻るので復職と取りやすい。週に数時間、代わりが見つかるまで、という条件を聞く。',
      use: 'Welcome back! We missed you.（おかえり！寂しかったよ）' },

    // R fix: V2 (blind 60 %): "in writing" was a filler; now "accepts it and backs down", "noted" read as agreement
    // why: think again ← Japanese 検討します frame (noted = 承りました, a soft promise); backs down ← "noted" heard as "you're
    //   right"; "Once again, noted" right after "Once again, I object" mirrors and dismisses it, and the plan goes ahead
    //   (seg now runs on through "I have also asked Jerry to come in…", which shows the plan going ahead)
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'noted', seg: [255.1, 265.9],
      stem: 'When the objection comes again, what does Ron’s short reply do?',
      choices: ['Hears the complaint and changes nothing', 'Promises to think it over once more',
                'Accepts the complaint and backs down'], a: 0,
      cue: '反対の言葉と、同じ出だしで始まる返事。',
      line: 'Once again, I object in the strongest possible terms. — *Once again, noted.*',
      said: '「改めて強く反対」に、「改めて、聞いておく」と同じ形で返す。',
      mean: 'noted は「聞いた」だけ。同じ形で返して、反対を受け流している。',
      trap: '日本語の「承りました」のように前向きに取りやすい。行動が続かなければ、そのまま。',
      use: 'Your concern is noted.（ご意見は承りました）' },

    // R fix: V2 (blind 70 %): "help Tom clear his work" was a filler; now "watched to make sure he works", built on
    //   "watch him eat… anything he might do or say"
    // why: train intern ← "until we find a permanent replacement" heard as Jerry training the next hire; watched ← "watch
    //   him" and "anything he might do" heard as checking up on him; "everyone will get to" makes it a treat, not a check
    { id: 'i2', skill: 'infer', level: 'C1', point: 'hearing', seg: [266.2, 279.0],
      stem: 'What do Ron’s words about Jerry’s weekly visit suggest?',
      choices: ['The teasing will land on Jerry, not Tom', 'Jerry will train the next new intern', 'Jerry will be watched to make sure he works'], a: 0,
      cue: 'son のあと、みんなが「何をできるか」の列。',
      line: 'Are you hearing me, son? … everyone will get to *watch him eat* and *talk to him about anything*…',
      said: '「聞いてるか。Jerry は週1で来て、みんなが何でも話のネタにできる」。',
      mean: 'いじられ役を Jerry に戻して、Tom を助ける手。',
      trap: 'watch him を「見張る」と取りやすい。get to（〜できる）は楽しみの言い方で、列はからかう材料。',
      use: 'Are you hearing me?（ちゃんと聞いてる？分かってる？）' },
    // R drop: nt1 (C2 pragma) — the same fact as i2 (point `hearing`), and blind-guessable at 60 % (only the key named
    //   Jerry); never shipped, so deleted; the bank keeps two C2 items (nt3, nt2)
  ]
};
