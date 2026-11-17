// “April Breaks up Ann and Tom | Parks and Recreation” (the official Parks and Recreation channel, Season 4): Ann
// and Tom trade lists of each other's annoying habits until April, fed up, breaks them up; drunk later, she tells
// them their fight is stupid, and they make up because of it.
// Segments from the captions, words from whisper (2026-11-16). Untested: 2–5 s (“consistently disagree on who wore it
// best”, captions garbled), 38–44 s (who says “give it a rest”), 52–60 s (garbled in both), 64 s (whisper “because
// of”, captions “cuz”), 65 s (“I didn't say anything”, captions lack “I didn't”), 75 s (whisper “now everything's
// great”, captions “yeah that's great”) and 79–83 s. The captions' “no nose” at 11.9 s is “no-no's” (same sounds).
// The first list's speaker is never named in both sources, so no stem names who gives it.
// EAR CHECK: 74.1 s w1 — the speaker of “I apologized and he apologized” is taken as Ann (from “he”; no name is said)
// REVIEW 2026-11-16: pass 4, fix 16, drop 0, new 0; ear checks 1
import type { Clip } from '../types.ts';

export const aprilBreakup: Clip = {
  id: 'aprilbreaks', video: 'ytv8egbLeL0', title: 'April Breaks up Ann and Tom', dur: 93, wpm: 159, band: 'mid',
  tags: ['恋愛', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2, blind 70 % right; "friends and family" and "jobs" were fillers. Two readings built from the list's own
    //   items replace them.
    // why: looks ← "who wore it best" heard as a fight about clothes; money ← "iPad 1" and "20-inch rims" heard as a fight
    //   about what they buy
    { id: 'g2', skill: 'gist', level: 'B1', point: 'fight', reveals: ['books'], seg: [0, 22.6],
      stem: 'What are Ann and Tom mostly complaining about?',
      choices: ['Each other’s little habits and tastes', 'Each other’s looks and the way they dress', 'Each other’s money and what they buy'], a: 0,
      cue: '二人が並べる「相手のいやなところ」の中身。',
      line: 'You still use an *iPad 1*. You *read books* all the time.',
      said: '古いiPadを使う、本ばかり読む、ひどい映画を見せる、など相手の癖を言い合う。',
      mean: '別れ話の理由にしては、小さな好みや習慣ばかり。',
      trap: 'ホイールや iPad でお金の話に聞こえる。項目を一つずつでなく、種類でまとめて聞く。',
      use: 'We just have different tastes.（好みが違うだけだよ）' },

    // R fix: V2/K6, blind 60 % right; the key alone put “faults” in scare quotes. All three are now "one of the faults is
    //   really…", and a missed-"still" reading replaces the calm-delivery one.
    // why: his own ← the Japanese frame of self-deprecation, with "you" swallowed at speed; gave up ← "still" missed in
    //   "You still use an iPad 1", as if it were an old habit
    { id: 'h1', skill: 'humor', level: 'C1', point: 'books', seg: [1.9, 10.4],
      stem: 'In the first list of complaints, what makes it funny?',
      choices: ['One of the faults is really a good habit', 'One of the faults is really his own habit', 'One of the faults is one she gave up long ago'], a: 0,
      cue: '並ぶ項目のうち、最後のもの。',
      line: 'You still use an iPad 1. You *read books all the time*.',
      said: '「古いiPadを使い続けている」「いつも本を読んでいる」と相手の欠点を挙げる。',
      mean: '本をよく読むのは、ふつうはほめられる点。それを欠点に入れるずれが笑い。',
      trap: '真面目な口調だと全部本気の欠点に聞こえる。still まで一項目ずつ聞く。',
      use: 'Is that a bad thing, though?（それって悪いこと？）' },

    // R fix: V2, blind 75 % right; "write their lists together" was a filler. A Japanese-frame reading of "Okay" (accepting
    //   the criticism) replaces it.
    // why: agreeing ← "Okay" heard as 分かった, taking the list on board; more of hers ← "for you" heard as her asking him
    //   for more
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'own', seg: [9.6, 16.3],
      stem: 'When Ann answers the list with “Okay…”, what is she doing?',
      choices: ['Hitting back with a list of his faults', 'Agreeing to work on the faults he named', 'Asking him to name a few more of hers'], a: 0,
      cue: '「Okay」のあとの一文と、続く「You…」。',
      line: 'Okay. *How about my own* no-no’s for you? You make me see terrible movies…',
      said: '「じゃあ、私からのダメ出しは？」と言い、彼のいやなところを並べ始める。',
      mean: 'my own ＝ 今度はこっちの番。言われた分を言い返す。',
      trap: 'Okay を「分かった」と取ると、受け入れたように聞こえる。続く my own が言い返しの印。',
      use: 'Okay, how about my side of it?（じゃあ、私の言い分は？）' },

    // R fix: V2, blind 50 % right; "walks out" was easy to rule out. Another in-the-seat annoyance replaces it.
    // why: sleeps ← "sleep through" has the same shape; phone ← the other common movie-theater complaint
    { id: 'd2', skill: 'detail', level: 'B1', point: 'movies', seg: [12.4, 16.3],
      stem: 'What does Ann say Tom does at the movies?',
      choices: ['He talks all the way through them', 'He sleeps all the way through them', 'He’s on his phone all the way through'], a: 0,
      cue: '「terrible movies」のあと。',
      line: 'You make me see terrible movies and then you *talk through them*.',
      said: '「ひどい映画を見せるうえに、上映中ずっとしゃべる」と言う。',
      mean: 'talk through ＝ 最初から最後までしゃべり続ける。through は「ずっと」。',
      trap: 'sleep through（寝て過ごす）も同じ形。through の前の動詞を聞く。',
      use: 'The kids talked through the whole show.（子どもたち、ショーの間ずっとしゃべってた）' },

    // why: 12 ← "twenty" and "twelve" both start with tw-; 22 ← "twenty" heard, then the "-inch" taken for "-two"
    { id: 'n1', skill: 'number', level: 'B1', point: 'rims', seg: [13.7, 19.1],
      stem: 'How big are the rims Ann says Tom put on his car?',
      choices: ['12-inch', '20-inch', '22-inch'], a: 1, keep: true,
      cue: '「rims」の直前の数。',
      line: 'You put *20-inch* rims on your Volkswagen Golf.',
      said: '「フォルクスワーゲンのゴルフに20インチのホイールを付けた」と言う。',
      mean: '小さな車に大きなホイールを付ける見栄っぱりな改造。彼女の不満の一つ。',
      trap: 'twenty の t は弱く「トゥウェニー」に近い。twelve と出だしが同じ。',
      use: 'Do you have a 20-inch suitcase?（20インチのスーツケースある？）' },

    // R fix: V2, blind 70 % right; "turns them back on her" was weak. A like-you mishearing (s1's trap, same point)
    //   replaces it.
    // why: loves her ← "like me more" heard as "like you more", the expected making-up line; fair ← "everything you just
    //   said" heard as "you're right about everything"
    { id: 'h2', skill: 'humor', level: 'C1', point: 'likeme', seg: [22.5, 26.2],
      stem: 'Why does the audience laugh at Tom’s answer to Ann’s list?',
      choices: ['He takes all her complaints as compliments', 'He says her list makes him love her more', 'He calmly agrees that every point is fair'], a: 0,
      cue: '最後の「more」の前の二語。',
      line: 'Everything you just said makes me *like me more*.',
      said: '「君が今言ったこと全部で、自分がもっと好きになった」と返す。',
      mean: '悪口のつもりの項目を、自分の魅力として受け取る。自分大好きな人の返し方。',
      trap: 'like you と聞くと仲直りに聞こえる。最後の目的語が me か you かで意味が逆になる。',
      use: 'I’ll take that as a compliment.（ほめ言葉として受け取っとく）' },

    // why: like you ← the expected reply after complaints (making up); like it ← "me" weak and short, heard as
    //   "it"; you like me ← the two pronouns swapped
    { id: 's1', skill: 'sound', level: 'B2', point: 'likeme', seg: [22.5, 26.2],
      stem: 'Fill the gap: “Everything you just said makes ___ more.”',
      choices: ['me like me', 'me like you', 'me like it', 'you like me'], a: 0,
      cue: '「makes」のあと、短い語が三つ。',
      line: 'Everything you just said makes *me like me* more.',
      said: '「全部聞いて、自分がもっと好きになった」。me は2回とも弱く短い。',
      mean: 'makes me like me ＝ 自分を好きにさせる。「ミライクミ」とひと続きになる。',
      trap: '予想に合わせて like you と聞きやすい。弱い代名詞ほど音で聞く。',
      use: 'This view makes me want to stay.（この景色を見ると残りたくなる）' },

    // R fix: V2, blind 80 % right; "sad" and "amused" were easy to rule out. Two other uneasy feelings replace them.
    // why: worried ← "breaking you up" next heard as a fear they'll split; awkward ← the third-wheel script: a friend stuck
    //   between a fighting couple
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'fedup', seg: [22.5, 28.15],
      stem: 'How does April feel about the two of them by this point?',
      choices: ['Fed up with listening to them', 'Worried the two will really split', 'Awkward about being stuck between them'], a: 0,
      cue: 'April が口を開いて最初の一文。',
      line: '*I can’t take it anymore*, okay?',
      said: '二人のやり取りを聞いていて「もう我慢できない」と言う。',
      mean: 'can’t take it anymore ＝ もう耐えられない。うんざりして口を出すきっかけ。',
      trap: 'take を「取る」と取ると意味がつかめない。この take は「我慢する」。',
      use: 'I can’t take this heat anymore.（この暑さ、もう無理）' },

    // R fix: V2, blind 75 % right; the title ("April Breaks up Ann and Tom") gives away the split. All three now read
    //   "break you up"; they differ on when and how, which "You guys are done" settles.
    // why: if they keep fighting ← "okay?" heard as a threat, not an announcement; a break ← break up read as 休憩, a pause
    //   for tonight
    { id: 'ph1', skill: 'phrase', level: 'B2', point: 'breakup', reveals: ['fedup'], seg: [25.8, 31.2],
      stem: 'What does April announce right after she’s had enough?',
      choices: ['She’s making them split up, starting now', 'She’s making them split up if they keep fighting', 'She’s telling them to take a break for tonight'], a: 0,
      cue: '「I’m breaking…」の目的語と、次の一文。',
      line: 'I’m *breaking you up*. You guys are *done*.',
      said: '「二人を別れさせる。もう終わり」と言う。',
      mean: 'break A up ＝ A（カップル）を別れさせる。break up with A とは形が違う。',
      trap: 'okay? が付くと「続けたら」という脅しにも聞こえる。are done で今すぐと分かる。',
      use: 'Okay, we’re done here.（よし、ここまで）' },

    // R fix: V2, blind 70 % right; "blame her" was weak. A made-up-on-their-own reading (from “we talked it out”)
    //   replaces it.
    // why: on their own ← "we talked it out… I apologized and he apologized" heard as the whole story; thank her ←
    //   "Thanks" is said, but for the reunion
    { id: 'g1', skill: 'gist', level: 'B2', point: 'outcome', seg: [26.0, 82.5],
      stem: 'How does April’s decision turn out by the end?',
      choices: ['Her drunken remark brings them back together', 'They make up on their own, without her help', 'They stay apart and thank her for the push'], a: 0,
      cue: '最後に二人が April に伝えること。',
      line: 'Well, we *got back together* again…',
      said: '別れさせたあと、酔った April の一言がきっかけで、二人はよりを戻す。',
      mean: '別れさせるつもりが、仲直りのきっかけに。計画の裏目。',
      trap: 'talked it out だけだと二人で解決した話に聞こえる。決め手は what you said。',
      use: 'It totally backfired.（完全に裏目に出た）' },

    // R fix: V2, blind 55 % right; "help them make up" was a filler. A she-really-forgot reading (she's drunk) replaces it.
    // why: forgotten ← she's drunk, so the question sounds like a real one; new subject ← anyway as a topic changer
    //   (それはそうと)
    { id: 'm1', skill: 'marker', level: 'B2', point: 'anyway', seg: [42.9, 47.5],
      stem: 'What does the last word of April’s question about the fight add?',
      choices: ['That whatever the reason, it can’t matter much', 'That she has simply forgotten what it’s about', 'That she wants to move on to a new subject'], a: 0,
      cue: '質問の最後に付いた一語。',
      line: 'Why are you guys fighting *anyway*?',
      said: '酔った April が「そもそも、何でけんかしてるの？」と聞く。',
      mean: '疑問文の最後の anyway ＝「そもそも」。理由なんて大したことない、という気持ちが入る。',
      trap: '酔って本当に忘れたとも取れるが、すぐ stupid と続く。理由を軽く見ている。',
      use: 'What are we doing here anyway?（そもそも何でここにいるんだっけ）' },

    // R fix: V2, blind 70 % right; "a fair point each" was weak. A same-template-same-reason reading replaces it.
    // why: same thing ← the two lines have one shape, so the reasons sound identical; hates both ← her "I hate Ann… I hate
    //   Tom" taken as her own feelings, not an act
    { id: 'i1', skill: 'infer', level: 'C1', point: 'stupid', seg: [45.1, 52.1],
      stem: 'When April acts out each side of the fight, what is her point?',
      choices: ['Neither side’s reasons are worth fighting over', 'They are both fighting over the very same thing', 'She has come to hate both of them herself'], a: 0,
      cue: '二人のまねのあとの、短い一言。',
      line: 'I hate Ann because of this *stupid reason*… I hate Tom for this *stupid reason*. *Who cares?*',
      said: '「アンが嫌い、くだらない理由で。トムが嫌い、くだらない理由で。どうでもいい」とまねる。',
      mean: '二人の言い分を同じ型で並べ、どちらもくだらないと示す。',
      trap: 'I hate を April 自身の気持ちと取りやすい。同じ型の繰り返しは、他人のせりふのまね。',
      use: 'It’s a small thing. Who cares?（小さなことだよ。どうでもいい）' },

    // why: sorry ← a past-tense confession heard as an apology (the Japanese frame); can't remember ← she is drunk,
    //   and asks a moment later what she said
    { id: 'i2', skill: 'infer', level: 'B2', point: 'surprise', reveals: ['outcome'], seg: [60.6, 64.2],
      stem: 'What does April’s “I broke you up” show about her?',
      choices: ['She thought they were still split up', 'She’s sorry she ever split them up',
                'She can’t remember splitting them up'], a: 0,
      cue: '一言のあとの「Well,」で始まる返事。',
      line: '*I broke you up.* — Well, we got back together again…',
      said: '寄り添う二人を見て「別れさせたでしょ」と言い、「よりを戻したんだ」と返される。',
      mean: '「別れさせたのに、何で？」という抗議。まだ別れていると思っていた。',
      trap: '過去形の一言は告白や謝罪に聞こえやすい。相手が Well, で事情を説明している点を聞く。',
      use: 'Wait, I thought you quit!（あれ、辞めたんじゃなかったの？）' },

    // R fix: V2, blind 50 % right; "walking her home" fit the drunk script. Two other looking-after-a-drunk scenes now.
    // why: water ← the sobering-up script; driving home ← the usual end of a drunk night, with "carrying" missed
    { id: 'd4', skill: 'detail', level: 'B1', point: 'bed', reveals: ['outcome'], seg: [65.6, 68.84],
      stem: 'When did April say the thing they now thank her for?',
      choices: ['While they were carrying her up to bed', 'While they were bringing her some water', 'While they were driving her back home'], a: 0,
      cue: '「Yeah,」のあとの場面の説明。',
      line: '…we were *carrying you to bed*…',
      said: '「あなたをベッドに運んでいたとき」と、その場面を説明する。',
      mean: '酔って運ばれている間に言った一言だった。本人が覚えていないのも無理はない。',
      trap: '酔った友だちを家まで送る、というよくある流れで想像しやすい。動詞 carrying を聞く。',
      use: 'Can you help me carry this upstairs?（これ、上まで運ぶの手伝って）' },

    // R fix: V2, blind 60 % right; "better off apart" ran against the reunion. A how-often reading of "arguing" replaces it.
    // why: too often ← "arguing" caught, "about stuff that was stupid" missed; sorry ← "apologized" comes right after, as
    //   what they did
    { id: 'd3', skill: 'detail', level: 'B2', point: 'stupid', seg: [66.0, 72.3],
      stem: 'What do they say April pointed out to them?',
      choices: ['That their fights were about silly things', 'That they were arguing far too often', 'That they should both say they were sorry'], a: 0,
      cue: '「correctly pointed out」のあと。',
      line: 'you correctly pointed out that we were arguing about *stuff that was stupid*',
      said: '「くだらないことでけんかしてるって、あなたが指摘した」と言う。',
      mean: 'stuff that was stupid ＝ くだらないこと。この一言で仲直りした。',
      trap: 'すぐあとの apologized から、謝れと言われた気がする。中身は that のあと。',
      use: 'We’re fighting about nothing.（くだらないことでけんかしてる）' },

    // anchor: 68.4–71.3 s "you correctly pointed out that we were arguing about stuff that was stupid" is the remark
    //   they thank her for; 76.7–79.6 s "No. I'm drunk. Don't listen to me." takes back exactly that
    // R fix: V2, blind 60 % right; "sleep it off" was easy to rule out. A wrong-target take-back (her "I'm breaking you
    //   up") replaces it.
    // why: rude things ← right mechanism, wrong target: her "I hate Ann… I hate Tom" act heard as insults to take back;
    //   breaking up ← right mechanism, wrong target: "Don't listen to me" applied to her earlier "I'm breaking you up"
    { id: 'nt1', skill: 'pragma', level: 'C2', point: 'undo', reveals: ['stupid'], seg: [66.45, 81.4],
      stem: 'Taken seriously, what would “Don’t listen to me” ask them to do?',
      choices: ['Go back to fighting, and split for real', 'Forget the rude things she said about them', 'Ignore that she ever tried to split them'], a: 0,
      cue: '二人が彼女の一言を聞いて、何をしたか。',
      line: 'you correctly pointed out… *stuff that was stupid*… — No. I’m drunk. *Don’t listen to me.*',
      said: '「くだらないけんかだと指摘してくれた」と礼を言われ、「酔ってるの、私の言うことは聞かないで」と返す。',
      mean: '二人が従ったのは彼女の言葉。本気で取り消すなら「けんかは大事、やっぱり別れて」になる。',
      trap: '「聞かないで」を失礼な発言へのおわびと取りやすい。何を取り消すかは、直前に礼を言われた中身。',
      use: 'Forget what I said. I take it back.（今の忘れて。取り消す）', retired: true },

    // anchor: 72.4–76 s "we talked it out… I apologized and he apologized… Thanks" credits her remark with the
    //   reunion; 76.7–79.6 s her "No. I'm drunk. Don't listen to me. No." is the punchline
    // R fix: V2, blind 65 % right; "Ann, for thanking a drunk" was weak. A right-target, wrong-reason near miss (she
    //   can't remember) replaces it.
    // why: fighting over nothing ← right mechanism, wrong target: the silly fight was the earlier joke, and here it's
    //   over; can't recall ← right target, wrong reason: she asked "What do you mean?", but her "No… don't listen to me"
    //   is about the result
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'outcome', seg: [66.45, 81.4],
      stem: 'In the scene where they thank April, who is the joke on?',
      choices: ['April, whose own words undid her plan', 'April, who can’t recall a word she said', 'Ann and Tom, for fighting over nothing'], a: 0,
      cue: '最後の「No.」が誰の、何への反応か。',
      line: '…I apologized and he apologized… *Thanks*. — *No.* I’m drunk.',
      said: '二人は「おかげで仲直りできた、ありがとう」と言い、April は「やめて、聞かないで」と嘆く。',
      mean: '別れさせたかった本人が、酔った一言で二人を元に戻した。笑いの的は、自分で計画を崩した April。',
      trap: '前半のけんかの印象で、二人が笑われていると聞きやすい。オチで嘆く人が、たいてい笑いの的。',
      use: 'Great. I did the exact opposite.（最悪、真逆のことしちゃった）', retired: true },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'talkout', seg: [70.9, 74.05],
      stem: 'Type what they did: “And so we ___ and I apologized.” (3 words)', answer: 'talked it out',
      cue: '「And so we」のすぐあと。三語がつながる。',
      line: 'And so we *talked it out* and I apologized',
      said: '「それで話し合って、私が謝った」。「トークティダウ」とつながる。',
      mean: 'talk it out ＝ とことん話し合って解決する。',
      trap: 'ed の t と it がくっつき、it が聞こえにくい。out の t もほぼ消える。',
      use: 'Let’s sit down and talk it out.（座って、ちゃんと話そう）' },

    // R fix: K1, the stem asked who explains how they made up. If Tom tells the carrying-to-bed half, "in turns" is
    //   defensible. The stem now names only the apology line.
    // why: Tom ← "I apologized" could be either voice until the next clause; in turns ← both were there, and "we" runs
    //   through the whole story
    { id: 'w1', skill: 'who', level: 'C1', point: 'teller', seg: [70.9, 76.5],
      stem: 'Who tells April about the two apologies?',
      choices: ['Ann', 'Tom', 'Ann and Tom, in turns'], a: 0,
      cue: '「I apologized and…」の次の代名詞。',
      line: 'I apologized and *he apologized*',
      said: '「私が謝って、彼も謝った」と説明する。',
      mean: 'he と言うので、話しているのはトムではなくアン。代名詞で話し手が分かる。',
      trap: 'we が続くので、二人で話しているように聞こえる。he や she が出たら、話し手はもう一人の方。',
      use: 'I said sorry, and so did she.（私が謝って、彼女も謝った）' },

    // R fix: V2, blind 55 % right; "pleased" was easy to rule out. A Japanese-frame modesty reading of "I'm drunk, don't
    //   listen to me" (いえいえ) replaces it.
    // why: modest ← "No, I'm drunk, don't listen to me" heard as the polite brush-off of thanks; puzzled ← she asked "What
    //   do you mean?" a moment earlier
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'undo', seg: [76.3, 81.6],
      stem: 'How does April react when they thank her?',
      choices: ['Horrified, and trying to take it back', 'Modest, and playing down her part', 'Puzzled, and asking what she did'], a: 0,
      cue: '最初の「No.」と、最後の「No.」。',
      line: '*No.* I’m drunk. *Don’t listen to me.* No.',
      said: 'お礼を言われて「やめて。酔ってるの。私の言うことは聞かないで」と繰り返す。',
      mean: '仲直りは彼女の望みと逆。自分の一言を取り消そうとあわてている。',
      trap: 'お礼を謙遜で返す日本語の型で聞きやすい。No を重ねるのは、望まない結果を取り消したいから。',
      use: 'Ignore me, I’m just tired.（気にしないで、疲れてるだけ）' }
  ]
};
