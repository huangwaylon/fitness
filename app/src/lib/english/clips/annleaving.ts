// REVIEW 2026-11-16: pass 7, fix 13, drop 0, new 0; ear checks 3
// “Ann Bribes Leslie with Food | Parks and Recreation” (the official Parks and Recreation channel, Season 6): Ann
// brings her Eagleton counterpart to meet Leslie, says she'll step down, and tells her she and Chris may leave Pawnee;
// Leslie twists, jokes and dodges, then tells the camera there are no hard feelings.
// Segments from the captions, words from whisper (2026-11-16). Ann, Evelyn, Chris and Leslie are named in the audio.
// Left out: the waffle stretch at 69–83 s (who says "Oh my God, look at that" and "Wait, what were you saying?" isn't
// settled by any name), the Joe Biden on a horse bit at 111–120 s (world knowledge, and "galloping" is "like" in
// whisper, "that" in the captions), and "I got a ton of work to do. I'm not super busy" at 122–125 s (the speakers
// and the "not" are unclear). No number in the clip.
// EAR CHECK: 19.4 s s1 — “wasn't” with its t dropped (both sources have “wasn't”)
// EAR CHECK: 56.1 s x1 — “put you up to” links into プチュアプトゥ; both sources agree on the words
// EAR CHECK: 98.6 s nt1 — “neither of us are” runs together fast; both sources have “are”, not “is”
import type { Clip } from '../types.ts';

export const annLeaving: Clip = {
  id: 'annleaving', video: 'f9QHuKzvBVc', title: 'Ann Bribes Leslie with Food', dur: 167, wpm: 158,
  band: 'mid', tags: ['友だち', '職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 60 %) + N7/C5: "face to face" echoed i2, and the line "so you could hear some things from me" is
    //   i2's answer, while `said` names the move (d3). The health-problem filler is now "ask Leslie's advice", and
    //   g1 reveals fromme and leave.
    // why: work with Evelyn ← Evelyn is introduced "first of all", so she seems to be the point; advice ← "chat" +
    //   "talk to you about it" heard as asking for help with a decision
    { id: 'g1', skill: 'gist', level: 'B1', point: 'visit', reveals: ['fromme', 'leave'], seg: [0, 69.8],
      stem: 'What is the main reason Ann has come to see Leslie?',
      choices: ['To break some big news to her herself', 'To ask Leslie to work with Evelyn',
                'To ask Leslie’s advice on a big choice'], a: 0,
      cue: '「first of all」のあと、本題が来るまで。',
      line: 'I just wanted to chat… so you could *hear some things from me*.',
      said: '「私の口から聞いてほしいことがある」と始め、あとで町を出るかもと打ち明ける。',
      mean: 'first of all は前置き。本題は、自分の口から伝えたい大事な知らせ。',
      trap: '最初に Evelyn を紹介するので、それが目的に見えやすい。本題はあとに来る。',
      use: 'Got a minute? We need to talk.（ちょっといい？話がある）' },

    // R fix: V2 (blind 55 %): "annoyed" was weak. It's now "stiff and formal", from the stilted "Verbal things from my
    //   mouth".
    // why: excited ← "this is a surprise" + "everything's fine" heard as good news coming; formal ← "verbal things from
    //   my mouth" heard as on-purpose stiffness, with the self-check "Did that sound weird?" missed
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'weird', seg: [0.6, 11.0],
      stem: 'As Ann opens the chat, how does she come across?',
      choices: ['Nervous, and stumbling over her words', 'Excited, and eager to share good news',
                'Stiff and formal, like at a work meeting'], a: 0,
      cue: '自分の言い方について、自分で聞く一言。',
      line: 'Verbal things *from my mouth*. *Did that sound weird?*',
      said: '「口から出る言葉で」と言い直し、「今の変だった？」と自分で聞く。',
      mean: '同じことを言い直し、自分でおかしいと気づく。緊張している人の話し方。',
      trap: 'surprise や fine から明るい話に聞こえやすい。言葉のつまずきに注目。',
      use: 'Sorry, did that sound weird?（ごめん、今の変だった？）' },

    // R fix: V2 (blind 65 %): "a patient" was weak. It's now "old coworker from Eagleton", built from “from Eagleton”.
    // why: new boss ← "my… department" heard as Ann's chain of command, "counterpart" missed; old coworker ← "my…
    //   from Eagleton" heard as someone Ann once worked with there
    { id: 'd1', skill: 'detail', level: 'B2', point: 'evelyn', seg: [13.3, 18.5],
      stem: 'Who is Evelyn, according to Ann?',
      choices: ['The person who does Ann’s job in Eagleton', 'Ann’s new boss, sent over from Eagleton',
                'Ann’s old coworker from her time in Eagleton'], a: 0,
      cue: '「health department」のあとの一語。',
      line: 'She is my health department *counterpart* from Eagleton.',
      said: '「彼女はイーグルトンの保健部門で、私と同じ立場の人」と紹介する。',
      mean: 'counterpart ＝ 別の組織で同じ役目の人。上司でも部下でもない。',
      trap: 'my department だけだと上司や部下に聞こえる。counterpart は対になる相手。',
      use: 'She’s my counterpart in the Tokyo office.（東京支社で私と同じ担当の人）' },

    // why: was ← the n't's t drops and "wasn't" shrinks to a "was"-like sound; isn't ← the vowel is weak, so a present
    //   tense fits the ear too
    { id: 's1', skill: 'sound', level: 'B2', point: 'wasnt', seg: [18.5, 22.45],
      stem: 'Fill the gap: “There really ___ a ton of work for me there.”',
      choices: ['was', 'wasn’t', 'isn’t'], a: 1,
      cue: 'really のあと、短い一語の終わりの音。',
      line: 'There really *wasn’t* a ton of work for me there.',
      said: '「向こうでは仕事があまりなかった」と言う。wasn’t の t はほぼ消える。',
      mean: 'not a ton of ＝ そんなに多くない。次の「住民がとても健康」が理由。',
      trap: 'n’t の t が消えても「ン」の音は残る。次の文とのつながりでも確かめる。',
      use: 'There wasn’t a ton of traffic.（そんなに混んでなかった）' },

    // R fix: V2 (blind 65 %) + C5: the stem's "little work" answers s1 (wasn't), so d2 reveals wasnt. "Too small" is
    //   now "rarely ask for help".
    // why: plenty of workers ← "health department" + "a ton of work" heard as staff, not need; rarely ask ← "very
    //   healthy" half caught as a habit of the townspeople, not their health
    { id: 'd2', skill: 'detail', level: 'B1', point: 'healthy', reveals: ['wasnt'], seg: [18.5, 22.45],
      stem: 'Why was there little work for Evelyn back in Eagleton?',
      choices: ['The people there are very healthy', 'The town has plenty of health workers',
                'The people there rarely ask for help'], a: 0,
      cue: '仕事がなかった、のすぐあとの一文。',
      line: '*Eagletonians are very healthy*.',
      said: '「イーグルトンの人はとても健康だから」と理由を言う。',
      mean: '健康な町では保健の仕事が少ない。直後の、不健康な町の話との対比。',
      trap: '仕事が少ない理由として、人手や町の規模を考えやすい。文の主語 Eagletonians を聞く。',
      use: 'Everyone here is pretty healthy.（ここの人はみんな元気）' },

    // R fix: V2 (blind 65 %): "making fun of Eagleton" was weak. It's now "proud of how healthy Pawnee is", the
    //   same pride with the facts flipped.
    // why: a warning ← "challenge" + disease names heard as a real caution; proud of health ← the proud tone heard,
    //   and "mega-diabetes" missed after "very first documented case"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'textbooks', seg: [22.4, 34.5],
      stem: 'Why does Leslie’s welcome to Evelyn get a laugh?',
      choices: ['She sounds proud of how unhealthy Pawnee is', 'She is warning Evelyn the job is dangerous',
                'She sounds proud of how healthy Pawnee is'], a: 0,
      cue: '最後の「textbooks」の言い方。',
      line: 'Pawnee has the *very first documented case* of mega-diabetes… *we’ve been written about in textbooks*.',
      said: '「メガ糖尿病の最初の例があり、教科書にも載った」と話す。',
      mean: '町の不健康さを名誉のように自慢している。中身と誇らしげな言い方のずれが笑い所。',
      trap: 'challenge を危ない仕事の警告と取りやすい。first や textbooks は自慢の語。',
      use: 'We were even written up in the paper.（新聞にまで載ったんだ）' },

    // why: busy ← the disease list just before ("interesting challenge"); lonely ← a kind reading of feeling sorry for
    //   a newcomer (気の毒に＝新入りへの同情)
    { id: 'ph1', skill: 'phrase', level: 'B2', point: 'shoes', seg: [41.4, 47.5],
      stem: 'Why does Leslie say she feels sorry for Evelyn?',
      choices: ['No one could ever do Ann’s job as well', 'Pawnee’s health problems will keep her busy',
                'She seems lonely, new in a strange town'], a: 0,
      cue: '「I mean」のあと、足の話。',
      line: 'I feel sorry for her. I mean, *nobody can fill your shoes*, Ann, with your tiny little doll feet.',
      said: '「気の毒。誰も代わりは無理。小さな足でもね」と言う。',
      mean: 'fill someone’s shoes ＝ 後を継ぐ。小さな足の冗談で文字通りにも使う。',
      trap: 'feel sorry から、新しい町で大変そう、と取りやすい。理由は I mean の後。',
      use: 'Nobody can fill her shoes.（彼女の代わりは誰にもできない）' },

    // R fix: V2 (blind 65 %): "share it" was weak. It's now "keep it, but hand some tasks to Evelyn", a partial
    //   reading of "turn over".
    // why: hand some tasks ← "turn… over to Evelyn" caught, and "step down" missed; train ← Evelyn has just been
    //   brought in to meet Leslie, like a new hire
    { id: 'ph2', skill: 'phrase', level: 'B1', point: 'stepdown', seg: [47.4, 55.0],
      stem: 'What is Ann planning to do about her job?',
      choices: ['Leave it and hand it over to Evelyn', 'Keep it, but hand some tasks to Evelyn',
                'Train Evelyn to help her with it'], a: 0,
      cue: '2回の「I’m gonna」、それぞれの動詞。',
      line: 'I’m gonna *step down*, and I’m gonna *turn my job over to Evelyn*.',
      said: '「私は辞めて、仕事をエヴリンに引き継ぐ」と言う。',
      mean: 'step down ＝ 役職を降りる。turn over to ＝ 引き渡す。',
      trap: 'turn over を「交代で」と取りやすいが、渡して自分は離れる意味。',
      use: 'I’m stepping down at the end of March.（3月末で退きます）' },

    // why: fired ← "step down" heard as being pushed out by a boss; a swap ← "turn my job over to Evelyn" + Evelyn's
    //   job in Eagleton
    { id: 'i1', skill: 'infer', level: 'B2', point: 'putup', seg: [54.7, 60.0],
      stem: 'What does Leslie first assume about Ann’s plan?',
      choices: ['Someone has talked Ann into it', 'Ann has been fired from her job',
                'Ann wants to swap jobs with Evelyn'], a: 0,
      cue: '「What? No.」のあとの質問。',
      line: 'Did somebody *put you up to this*? Was it Evelyn? I knew she was a monster.',
      said: '「誰かに言われた？エヴリン？やっぱり怪物だ」と言う。',
      mean: 'put someone up to ＝ そそのかす。初対面の人のせいにするほど認めたくない。',
      trap: 'step down から「クビ」と取りやすい。主語 somebody が「誰かのせい」。',
      use: 'Who put you up to this?（誰にそそのかされたの？）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'putup', seg: [55.4, 58.4],
      stem: 'Type what Leslie asks: “Did somebody ___ this?” (4 words)', answer: 'put you up to',
      cue: '「What? No.」のすぐあと。',
      line: 'Did somebody *put you up to* this?',
      said: '「誰かにやらされてるの？」と聞く。',
      mean: 'put you up to ＝ あなたをそそのかす。4語が一つのかたまりで速く言われる。',
      trap: 'put の t と you がつながり「プチュ」、up to は「アプトゥ」。語の切れ目を音の塊から探す。',
      use: 'My sister put me up to it.（姉にそそのかされた）' },

    // R fix: V2 (blind 50 %): the key was the only choice with "family" and with leaving Pawnee. The choices now pair
    //   leaving or staying with family or marriage.
    // why: staying ← "Pawnee" + "start our family" heard with "leaving" lost; married ← "start our family" heard as
    //   a wedding plan
    { id: 'd3', skill: 'detail', level: 'B1', point: 'leave', seg: [59.9, 69.8],
      stem: 'What are Ann and Chris thinking about doing?',
      choices: ['Leaving Pawnee to start a family', 'Staying in Pawnee to start a family',
                'Leaving Pawnee to get married somewhere'], a: 0,
      cue: '「Chris and I」のあと、about に続く語。',
      line: 'we are thinking very seriously about *leaving Pawnee* and moving somewhere else *to start our family*.',
      said: '「クリスと、町を出て家族を作ることを真剣に考えている」と言う。',
      mean: 'start a family ＝ 子どもを持つ。結婚の話ではなく、子育ての場所選び。',
      trap: 'family から結婚を思い浮かべやすい。start a family は子どもを持つこと。',
      use: 'We want to start a family soon.（そろそろ子どもがほしい）' },

    // R fix: V2 (blind 60 %): "say it once more, slowly" was weak. It's now "put it in her own words to show she
    //   cares", the paraphrase technique learners are taught.
    // why: checking ← "if I'm hearing you correctly" is normally a real check (確認の決まり文句); show she cares ← the
    //   textbook active-listening paraphrase, with the added "not" missed
    { id: 'pr1', skill: 'pragma', level: 'C1', point: 'hearing', seg: [84.6, 90.5],
      stem: 'When Leslie sums up what Ann said, what is she doing?',
      choices: ['Turning it into what she wants to hear', 'Checking politely that she understood',
                'Putting it in her own words to show she cares'], a: 0,
      cue: 'まとめた文の中の、小さな否定の語。',
      line: 'So, if I’m hearing you correctly, you’re telling me you’re *not* thinking about leaving Pawnee.',
      said: '「つまり、町を出ることは考えていないってことね」とまとめる。',
      mean: '確認の決まり文句に not を足して、逆の意味にしている。聞きたくない話の書きかえ。',
      trap: 'この決まり文句は普通は本当の確認。中身が相手の話と合っているかを聞く。',
      use: 'If I’m hearing you right, you’re saying no?（つまり、ノーってこと？）' },

    // R fix: V2 (blind 60 %): "sad but helps plan" was weak. It's now "dodging it, then admits she's hurt", which
    //   reads the hurt as stated (she says "No hard feelings").
    // why: argues ← "What? No." and the questions at the start look like a fight to keep her; admits hurt ← the
    //   hurt that shows in her words heard as an admission
    { id: 'g2', skill: 'gist', level: 'B2', point: 'dodge', reveals: ['hearing', 'notjoke', 'nohard'], seg: [84.6, 146.0],
      stem: 'How does Leslie deal with Ann’s news over the whole scene?',
      choices: ['She keeps dodging it, then claims she’s fine', 'She argues until Ann agrees to stay put',
                'She keeps dodging it, then admits she’s hurt'], a: 0,
      cue: '知らせのあとの、Leslie の返し方の連続。',
      said: '言いかえたり、冗談であってほしいと言ったりして、最後は平気だと話す。',
      mean: '正面から受け止めず、言いかえや冗談でかわし続ける。最後の言葉も本心ではない。',
      trap: '冒頭の What? No. から説得の場面に見えやすい。その後は反論せず、話をそらしている。',
      use: 'Let’s not talk about it right now.（今その話はやめよう）' },

    // R fix: V2 (blind 70 %): "joke more in general" was weak. It's now "pretending she knew it was a joke".
    // why: teasing ← "classic Ann 'not' jokes" sounds like a running tease about her humor; pretending ← "Is this one
    //   of those…" heard as a knowing wink, with "hoping" missed
    { id: 'h2', skill: 'humor', level: 'C1', point: 'notjoke', seg: [90.4, 97.0],
      stem: 'Why does Leslie’s “I was hoping that you had started” get a laugh?',
      choices: ['She’d rather believe Ann is joking than leaving', 'She’s teasing Ann for never telling jokes',
                'She’s pretending she knew all along it was a joke'], a: 0,
      cue: '「I don’t do that」への返事。',
      line: 'Is this one of those classic Ann “not” jokes? … — I don’t do that. — *I was hoping that you had started*.',
      said: '「お決まりの『なーんてね』？」と聞き、「しない」と言われ「始めたのかと期待した」と返す。',
      mean: '冗談であってほしい、という必死さ。ありえない望みにすがるのが笑い所。',
      trap: 'ユーモアをからかっていると取りやすい。望みの中身は今回の知らせ。',
      use: 'Please tell me you’re joking.（冗談だと言って）' },

    // anchor: 98.2–99.4 s "It's just neither of us are from Pawnee": both sources have "are", four weak words at
    //   speed, right after "It's not definite"
    { id: 'nt1', skill: 'dict', level: 'C2', point: 'neither', seg: [96.6, 100.1],
      stem: 'Type the words: “It’s just ___ from Pawnee.” (4 words)', answer: 'neither of us are',
      cue: '「not definite」のあと。文法より、聞こえた音を。',
      line: 'It’s just *neither of us are* from Pawnee',
      said: '「ただ、二人ともポーニーの出身じゃないし」と言う。4語がひと続きで速い。',
      mean: '文法の本では is だが、会話では are もよく使われる。of us は「オヴァス」と弱くつながる。',
      trap: '習った文法に合わせて is と書きたくなる。書き取りは、正しい文でなく言われた音を書く。',
      use: 'Neither of us are morning people.（二人とも朝が苦手）' },

    // R fix: V2 (blind 70 %): the key was the only middle reading. The second distractor is now "softens it but hides
    //   that it's final".
    // why: takes it back ← "not" heard as cancelling the plan, the reasons after it missed; hides it's final ← the
    //   list of reasons heard as a decision already taken, the softener as tact
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'definite', seg: [96.8, 109.8],
      stem: 'What does Ann’s “It’s not definite” do?',
      choices: ['It softens the news without taking it back', 'It takes the news back to calm Leslie down',
                'It softens the news but hides that it’s final'], a: 0,
      cue: '「It’s not definite」のあと、just に続く理由。',
      line: '*It’s not definite*. It’s just… I have a whole family in Michigan…',
      said: '「決まりじゃない。ただ、家族はミシガンだし…」と理由を並べる。',
      mean: '決定ではないと和らげつつ、理由を並べて本気度を伝える。撤回ではない。',
      trap: 'not が聞こえると「やめた」と取りやすい。あとに理由が続けば、話はまだ生きている。',
      use: 'It’s not final, but I’m leaning that way.（決定じゃないけど、その方向）' },

    // why: his family ← "a whole family in Michigan" is Ann's reason, said just before; old friends ← a usual reason to
    //   miss a place
    { id: 'd4', skill: 'detail', level: 'B1', point: 'chris', seg: [99.8, 105.95],
      stem: 'What does Ann say Chris is missing?',
      choices: ['Life in a bigger city', 'His family back home', 'Time with his old friends'], a: 0,
      cue: '二つ目の and のあと、主語が変わる。',
      line: 'I have a whole family in Michigan, and *Chris is missing life in a bigger city*',
      said: '「私の家族はみんなミシガンにいるし、クリスは大きな街の暮らしが恋しい」と言う。',
      mean: 'miss ＝ 恋しい。理由は二人それぞれ：アンは家族、クリスは都会。',
      trap: '直前のアンの家族の話と混ざりやすい。主語が変わる and のあとを聞き分ける。',
      use: 'I really miss life in the city.（都会の暮らしが恋しい）' },

    // R fix: V2 (blind 70 %): "break it to Evelyn" was weak. It's now "a chance to talk her out of it".
    // why: help choose ← "it's not definite" + "talk to you about it" heard as asking for advice; talk her out of
    //   it ← "not definite" heard as an opening for Leslie
    { id: 'i2', skill: 'infer', level: 'B2', point: 'fromme', seg: [105.8, 110.5],
      stem: 'Why does Ann make a point of telling Leslie herself?',
      choices: ['So Leslie won’t hear it from someone else', 'So Leslie can help her make the choice',
                'So Leslie has a chance to talk her out of it'], a: 0,
      cue: '最後の「so you could」のあと。',
      line: 'I just wanted to talk to you about it *so you could hear it from me*.',
      said: '「あなたには私の口から聞いてほしかった」と言う。最初と同じ言葉。',
      mean: 'hear it from me ＝ 人づてでなく本人から。親友への気づかい。',
      trap: 'talk about it から相談に聞こえやすい。from me は「ほかの人からでなく」。',
      use: 'I’d rather you heard it from me.（ほかの人より先に私から）' },

    // anchor: 131.8–145.1 s "I get it" opens and closes a question that calls staying "happy forever" and leaving
    //   "abandon her soul sister like an old shoe and move to a garbage city full of jerks"
    // why: right to go ← "I get it" taken as sincere acceptance, with the hurt heard as well (both halves half-true);
    //   hates the city ← "a garbage city full of jerks" heard as the whole complaint, with "soul sister" missed
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'nohard', seg: [129.5, 145.6],
      stem: 'Which plain-English version keeps what Leslie means in her comment?',
      choices: ['“I don’t get it at all, and it really hurts.”', '“It hurts, but I know she’s right to go.”',
                '“I get it; I just hate the city she picked.”'], a: 0,
      cue: '「I get it」と、間に入る言葉の強さの差。',
      line: 'who wants to stay in *the greatest town in the world* with her best friend… when she can *abandon her soul sister*…',
      said: '「わかるよ」で始めて終わり、間では「最高の町と親友より、親友を捨ててひどい街を選ぶ」と言う。',
      mean: '「わかる」で挟んだ問いが、去る方を「捨てる」と呼ぶ。形は理解、中身は「わからない、傷ついた」。',
      trap: 'I get it を言葉通りの理解と取りやすい。言葉の形と中身が逆なら、中身の方が本音。',
      use: 'Sure, I get it. Totally fine.（はいはい、わかったよ。全然平気）' },

    // R fix: V2 (blind 70 %) + K6: "Calm, and truly fine" was an extreme the key's "Deeply hurt" stood out against.
    //   It's now "A little sad, but truly fine with it".
    // why: a little sad ← "I get it" and "No hard feelings" taken at face value, with some sadness heard; angry at
    //   the city ← "a garbage city full of jerks" heard as the real target
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'nohard', seg: [131.3, 145.6],
      stem: 'In her comment to the camera, how does Leslie feel about Ann leaving?',
      choices: ['Deeply hurt, though she says she’s fine', 'A little sad, but truly fine with it',
                'Angry, mainly at the city Ann wants'], a: 0,
      cue: '「I get it」に挟まれた長い問いの中身。',
      line: 'abandon her *soul sister like an old shoe*… a garbage city full of jerks? *I get it*. *No hard feelings*.',
      said: '「わかる。親友を古い靴みたいに捨てて、ひどい街に行きたいならね。恨んでない」と言う。',
      mean: '「わかる」「恨んでない」と言いつつ、間の言葉が本音を出している。深く傷ついている。',
      trap: '最初と最後の言葉だけだと平気に聞こえる。間の言葉の強さで気持ちを測る。',
      use: 'No hard feelings, really.（本当に、恨んでないよ）' },
  ]
};
