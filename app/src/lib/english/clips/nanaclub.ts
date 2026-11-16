// “Michael Asks His Nana for Money - The Office US” (the official The Office channel, BEST OF SEASON 5): Michael
// pitches the Michael Scott Paper Company, with Pam, Vikram and Ryan as his “dream team”, to his Nana's investment club.
// The questions about a plan go badly, he asks for more money, and Nana says no, kindly and firmly.
// Segments from the captions, words from whisper (2026-11-16). Michael names Vikram (2.6 s) and Nana (5.5 s, 129.2 s);
// Nana is settled by “Nana, I really think…” answering “Michael, I don't know about this” (127.4 s). The other club
// members are never named, so no item keys on which of them speaks. Whisper's “No.” loop at 180–186 s is a
// hallucination (the captions have one “no” at 168.8 s, then music); nothing uses it. Untested: 99.5 s (“I think I can
// perform the same business”/“From the same business”), 108–110 s (whisper repeats “By working hard?”; the captions
// have only “statement” of “What's your mission statement?”), 123.7 s (who offers “same-day free delivery”; the stem
// doesn't say).
// REVIEW 2026-11-16: pass 6, fix 17, drop 0, new 0; ear checks 1 (unchanged)
// OPEN: h3 and i1 are the same joke shape (a fall told as a rise, for Vikram then Ryan); after h3, i1 is easier. Both
//   kept: different people and different words (“humble beginnings” vs “recent”)
// EAR CHECK: 18.5 s h1 — “what she would have wanted” (whisper) or “what you would have wanted” (captions); then
//   “Does want” / “does one”. h1's key (he spoke of Nana as if she'd died) assumes “she” and “Does want”
import type { Clip } from '../types.ts';

export const nanaclub: Clip = {
  id: 'nanaclub', video: 'VeY8XkJRA4U', title: 'Michael Asks His Nana for Money', dur: 186, wpm: 137, band: 'slow',
  tags: ['お願い・断り', '職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2, “tells him to stop” was the only rude choice; now a second no-answer move (a promise to explain later)
    //   that the audio rules out
    // why: answers it ← the club is named later (“my Nana's investment club”), moved up here; explain later ← the
    //   friendly “I like that” heard as the usual “good question, I'll get to it”, but no promise is made
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'vikram', seg: [0, 5],
      stem: 'What does Michael do with Vikram’s question about the club?',
      choices: ['Praises the asking but gives no answer', 'Says that it’s his grandmother’s club',
                'Thanks him and says he’ll explain later'], a: 0,
      cue: '質問のあと、返事の最後の3語。',
      line: 'What sort of investing club is this? — Vikram, you ask a lot of questions *and I like that*.',
      said: '「どんな投資クラブなの？」と聞かれ、「質問が多いね、そこがいい」とだけ返す。',
      mean: '質問をほめる形で、中身には答えずに話を流している。',
      trap: 'a lot of questions は文句にも聞こえるが、and I like that でほめ言葉になる。',
      use: 'Great question. Let’s come back to that.（いい質問だね。あとで話そう）' },

    // why: doesn't know much ← near miss: he dodges, but the next seconds show what he hides; finds Vikram annoying ←
    //   sincerity flip on “and I like that”
    // anchor: 5–17 s right after the dodge, “Hey, Nana!” and, to camera, “my Nana's investment club”
    { id: 'c2', skill: 'attitude', level: 'C2', point: 'vikram', reveals: ['family'], seg: [0, 17.6],
      stem: 'When Michael praises Vikram’s questions, what is he trying not to say?',
      choices: ['That the club is just his grandmother’s', 'That he knows very little about investing',
                'That he finds Vikram tiring already'], a: 0,
      cue: 'ほめたすぐあと、誰にあいさつし、カメラに何と言うか。',
      line: 'you ask a lot of questions and I like that. — *Hey, Nana!* … *my Nana’s investment club*',
      said: '質問をほめてはぐらかし、すぐ「ナナ！」とあいさつ。カメラには「祖母の投資クラブ」と話す。',
      mean: '答えはすぐあとにある。正直に答えると「祖母とその友だちの集まり」になってしまう。',
      trap: '投資に詳しくないのも本当らしいが、ここで聞かれたのはクラブの正体。隠し事は質問とセットで考える。',
      use: 'Good question! Anyway, moving on.（いい質問！さて、次に行こう）' },

    // R fix: K6, “always” sat only in a distractor
    // why: back new businesses ← “investment club” heard as a business that looks for startups; Nana offered ← “my
    //   Nana's” heard as her idea, not his
    { id: 'd0', skill: 'detail', level: 'B1', point: 'family', seg: [8.3, 17.6],
      stem: 'In his talk to the camera, why does Michael say asking is fine?',
      choices: ['People often turn to family when starting out', 'Investment clubs like to back new businesses',
                'His Nana offered to help with his company'], a: 0,
      cue: '話の最初の一文。誰に頼ると言っているか。',
      line: '*People turn to their families* all the time when they need help *starting out*.',
      said: '「始めたばかりのとき、家族に頼るのはよくあること」とカメラに話す。',
      mean: 'turn to ～ ＝ ～を頼る。祖母のクラブに頼むことを、普通のことだと言っている。',
      trap: 'Nana が聞こえると祖母の申し出に聞こえやすい。主語は people。',
      use: 'You can always turn to me.（いつでも頼ってね）' },

    // R fix: V2, “the club's name” was weak; now the near sound does/doesn't (he took back that she'd want it)
    // why: Papa ← he brings up Papa later in the scene, so a name slip seems likely; took it back ← “Does want” heard as
    //   “doesn't want”, the n't filled in
    { id: 'h1', skill: 'humor', level: 'C1', point: 'wanted', seg: [11.9, 21.4],
      stem: 'Why does Michael correct himself at the end of his talk to the camera?',
      choices: ['He spoke of Nana as if she had died', 'He meant to name Papa, not Nana',
                'He took back that she would want it'], a: 0,
      cue: 'would have wanted の形と、言い直した短い2語。',
      line: 'that’s what she *would have wanted*. *Does want.*',
      said: '「きっと祖母もそれを望んだだろう」と言いかけ、「望んでいる」と言い直す。',
      mean: 'would have wanted は亡くなった人に使う形。慌てて現在形に直す。',
      trap: 'Does を doesn’t と聞くと撤回に聞こえる。直したのは時制。',
      use: 'She’d have loved this — I mean, loves.（彼女も喜んだだろうな…いや、喜んでる）', retired: true },

    // R fix: V2, “figures on paper sales” was easy to rule out; now the investor-pitch script (a business plan) that
    //   the scene breaks
    // why: a business plan ← the usual pitch script, but he has none (“what specifically?”); a share of profits ←
    //   “profit” said, in the wrong relation
    { id: 'g1', skill: 'gist', level: 'B2', point: 'pitch', reveals: ['wanting', 'mission'], seg: [21.4, 127.3],
      stem: 'How does Michael try to win the club over?',
      choices: ['By talking up his team and his drive', 'By walking them through a business plan',
                'By offering them a share of the profits'], a: 0,
      cue: '仲間の紹介と、質問への答え方の両方。',
      said: '仲間を一人ずつ大げさに紹介し、利益の問いには気持ちと決意で答える。',
      mean: '数字や計画ではなく、チームの売り込みと熱意で押している。',
      trap: 'profit が何度も出るので数字の話に聞こえるが、具体的な数は一つも出ない。',
      use: 'Let me tell you about my team.（私のチームを紹介させてください）' },

    // R fix: V2, “already done great things” went against “someday”; now the sincere reading of “may… grab one” as a
    //   sure thing
    // why: aims too high ← “reaching for the stars” heard as a warning, not praise; she'll surely do it ← sincerity
    //   flip: the praise taken at face value, “may” and “surprise” lost
    // anchor: 49.2–56 s “someday she may just surprise us all and grab one”: a surprise means nobody expects it, and
    //   “someday” puts it in the future
    { id: 'c1', skill: 'attitude', level: 'C2', point: 'stars', seg: [46.8, 56.4],
      stem: 'What does Michael’s praise of Pam quietly admit?',
      choices: ['That no one expects much of her yet', 'That she sets her goals far too high',
                'That she will surely do great things someday'], a: 0,
      cue: '「someday」と「surprise」の二語が何を前提にしているか。',
      line: 'Pam is *always reaching for the stars*, and *someday she may just surprise us all* and grab one.',
      said: '「いつも星に手を伸ばすパム。いつかみんなを驚かせて、一つつかむかも」と紹介する。',
      mean: '驚かせる＝誰も期待していない、いつか＝まだ。ほめ言葉が、今は何もないと認めている。',
      trap: 'reaching for the stars は高望みでなく、夢を追うほめ言葉。鍵は後半の二語。',
      use: 'One day he might just surprise us.（いつか彼も驚かせてくれるかもね）' },

    // R fix: V2, the key was the only choice with a fall; it now names the mechanism (a fall told as a rise)
    // why: became a surgeon ← the usual “humble beginnings” story, the order lost; paid for school ← surgeon + selling
    //   medicine by phone tied into one plan
    { id: 'h3', skill: 'humor', level: 'C1', point: 'surgeon', seg: [58.6, 72],
      stem: 'Why is Vikram’s “humble beginnings” story funny?',
      choices: ['He calls a fall from surgeon to telemarketer a rise', 'He started out poor and became a famous surgeon',
                'He sold medicine by phone to pay for medical school'], a: 0,
      cue: 'beginnings のあとの職業と、最後の職業の順番。',
      line: 'From his *humble beginnings as a prominent surgeon*… to become… *telemarketer*',
      said: '「外科医という慎ましい出発点から、一番の電話営業マンへ」と紹介する。',
      mean: '出世話の決まり文句 humble beginnings を逆に使い、転落を出世のように語っている。',
      trap: '決まり文句から出世話を予想しやすい。何から何になったか、順番を聞く。',
      use: 'From humble beginnings to the big time.（下積みから大成功へ）' },

    // why: rose from a bowling alley ← the two jobs heard in the wrong order (“recent” lost); both at once ← “and” heard
    //   as two jobs held now
    { id: 'i1', skill: 'infer', level: 'C1', point: 'ryan', seg: [71.9, 86.9],
      stem: 'What does Ryan’s introduction suggest about his career?',
      choices: ['He fell from a top job to a low one', 'He rose from a low job to a top one',
                'He holds a top job and a low one now'], a: 0,
      cue: '二つの肩書きと、二つ目の前の短い形容詞。',
      line: 'The *youngest vice president*… and *recent bowling alley employee* Ryan Howard',
      said: '「史上最年少の副社長、そして最近までボウリング場の店員」と紹介する。',
      mean: 'recent ＝ 最近の。副社長のあとにボウリング場で働いていた、つまり転落している。',
      trap: '並べた順を出世の順と取りやすい。recent が付いているほうが後の出来事。',
      use: 'He’s a recent college graduate.（彼は最近大学を出たばかり）' },

    // R fix: V2/K6, the key was the only kind choice in an introduction; now a positive literal reading (diving in)
    // why: make a mess ← splash = 水しぶき, taken literally; throw himself in ← a dive into water, read as energy, not
    //   attention
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'splash', seg: [79.6, 86.9],
      stem: 'What does Michael say Ryan is about to do in paper?',
      choices: ['Make a big impression fast', 'Make a mess of things', 'Throw himself into the work'], a: 0,
      cue: '名前のすぐあと、「in paper」の前。',
      line: 'Ryan Howard is about to *make a splash* in paper.',
      said: '「ライアンは紙業界で一躍注目を浴びようとしている」と言う。',
      mean: 'make a splash ＝ 世間をあっと言わせる、話題になる。ほめ言葉。',
      trap: 'splash を水しぶきと取ると「ぶち壊す」「飛びこむ」に引かれる。紹介ならほめ言葉。',
      use: 'Her first book made a big splash.（彼女のデビュー作は大きな話題になった）' },

    // why: 13 ← “-teen” heard, the first part lost; 50 ← -teen/-ty, a long career for a man his age
    { id: 'n1', skill: 'number', level: 'B1', point: 'years', seg: [88.4, 94.4], keep: true,
      stem: 'How long has Michael spent learning the paper industry?',
      choices: ['13 years', '15 years', '50 years'], a: 1,
      cue: '「the last」のすぐあと。',
      line: 'I have spent *the last 15 years* learning the ins and outs of the paper industry',
      said: '「この15年、紙業界のすべてを学んできた」と言う。',
      mean: 'the ins and outs ＝ 細かいところまで全部。長い経験を売りにしている。',
      trap: 'fifteen は後ろに強勢があり「ティーン」が長い。fifty は前が強く、語尾が短い。',
      use: 'She knows the ins and outs here.（彼女はここを知り尽くしている）' },

    // R fix: V2, “higher prices for the same paper” was easy to rule out; now lower prices (the usual small-shop
    //   pitch)
    // why: bigger team ← “fighting crew” heard as strength in numbers; lower prices ← “low” heard, moved from
    //   overhead onto price
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'overhead', seg: [93.9, 102.75],
      stem: 'What does Michael say will make his company more profitable?',
      choices: ['A small team and low running costs', 'A big team that works harder',
                'Lower prices that win more customers'], a: 0,
      cue: 'crew の前の形容詞と、そのあとの2語。',
      line: 'with a *lean, mean fightin’ crew* and *low overhead*',
      said: '「少数精鋭と低い経費で、ずっと高い利益率でやれる」と言う。',
      mean: 'lean ＝ 少人数でむだがない。overhead ＝ 家賃などの固定費。',
      trap: 'fighting から人数の多さを、low から値下げを想像しやすい。low は overhead に付く。',
      use: 'We keep our overhead low.（うちは経費を低く抑えています）' },

    // R fix: V2, “turn profits” was ruled out by the idiom alone; now “return a profit”, a real phrase that “to turn”
    //   can sound like
    // why: earn a profit ← the onset t of “turn” lost after “to”; return a profit ← “to turn” run together, heard as
    //   “re-turn”
    { id: 's1', skill: 'sound', level: 'B2', point: 'turn', seg: [102.3, 106.2],
      stem: 'Fill the gap: “How do you expect to ___ in this economy?”',
      choices: ['turn a profit', 'earn a profit', 'return a profit'], a: 0,
      cue: '「expect to」のあと、つながる3語。',
      line: 'How do you expect to *turn a profit* in this economy?',
      said: '「この景気でどう利益を出すの？」とクラブの人が聞く。',
      mean: 'turn a は「ターナ」とつながる。turn a profit ＝ 利益を出す。',
      trap: 'to のあとの t が埋もれると earn に、to turn が続くと return に聞こえる。',
      use: 'The café turned a profit this year.（あのカフェは今年黒字になった）' },

    // why: low costs ← said a few seconds earlier in the pitch, not in his answer; free delivery ← offered later, moved up
    { id: 'd2', skill: 'detail', level: 'B2', point: 'wanting', reveals: ['overhead', 'delivery'], seg: [102.3, 109.6],
      stem: 'How does Michael answer the question about making a profit?',
      choices: ['By wanting it more and working hard', 'By keeping costs low with a small crew',
                'By offering free delivery on the same day'], a: 0,
      cue: '質問のすぐあと、By で始まる二つの答え。',
      line: '*By wanting it more?* *By working hard?*',
      said: '利益の出し方を聞かれ、「もっと強く望むことで？がんばって働くことで？」と答える。',
      mean: '方法ではなく気持ちで答えている。具体的な手段は一つもない。',
      trap: '低い経費や配送の話も出てくるが、それは前後の別の場面。質問の直後だけを聞く。',
      use: 'How? By working harder, I guess.（どうやって？もっと頑張って、かな）' },

    // R fix: V2, “far too long and detailed” went against three short lines; now the delivery offer that follows,
    //   taken as the mission
    // why: a money-back promise ← “guarantee” taken literally; delivery as its goal ← “same-day free delivery” comes
    //   right after, heard as part of the statement
    { id: 'h4', skill: 'humor', level: 'B2', point: 'mission', seg: [109, 123.5],
      stem: 'What makes Michael’s mission statement funny?',
      choices: ['It is all fighting talk with nothing about business', 'It promises the club their money back if he fails',
                'It promises same-day delivery as its main goal'], a: 0,
      cue: '「as follows」のあとの短い文の中身。',
      line: '*I will not be beat. I will never give up. I am on a mission.*',
      said: '「負けない。あきらめない。使命がある。マイケル・スコットの保証だ」と言う。',
      mean: '事業の目的を聞かれたのに、決意を並べるだけで中身がない。',
      trap: 'guarantee を返金保証と取りやすいが、保証しているのは自分の気合いだけ。',
      use: 'I will not give up on this.（これは絶対あきらめない）' },

    // why: next day ← the common delivery offer, “same” lost; for a small fee ← “free” lost before “delivery”
    { id: 'd3', skill: 'detail', level: 'B1', point: 'delivery', seg: [123.2, 127.3],
      stem: 'What extra is offered at the end of the pitch?',
      choices: ['Free delivery on the same day', 'Free delivery on the next day', 'Same-day delivery for a small fee'],
      a: 0,
      cue: '「offer」のあとの3語。', line: 'And I offer *same-day free delivery*.',
      said: '「さらに、当日無料配送もいたします」と付け加える。',
      mean: 'same-day ＝ 注文したその日に。free ＝ 無料。大会社に対抗するサービスの売り。',
      trap: 'next day のほうが聞き慣れているので、same を聞き逃しやすい。free も短く弱い。',
      use: 'Do you offer same-day delivery?（当日配送はありますか）' },

    // R fix: V2, “only from Nana” was ruled out by Nana's own no; now a compromise (a smaller amount)
    // why: a smaller amount ← “I need more than I originally asked” and the soft “I love you” heard as a deal struck;
    //   come back with a plan ← “what specifically?” and the usual investor script
    { id: 'g2', skill: 'gist', level: 'B1', point: 'outcome', reveals: ['more', 'love'], seg: [126.8, 164],
      stem: 'How does the meeting end for Michael?',
      choices: ['He walks away without any money', 'He gets a smaller amount than he asked',
                'He is asked to come back with a plan'], a: 0,
      cue: '最後に祖母が言う短い一語。何度言うか。',
      said: '質問に答えられず、増額を頼み、最後は祖母がはっきり断る。',
      mean: '家族でも、投資としては出せないという結末。',
      trap: '味方の声もあるので一部はもらえそうに聞こえるが、最後の答えは一つだけ。',
      use: 'Thanks for hearing me out.（話を聞いてくれてありがとう）' },

    // R fix: V2/K6, the key was the only gentle choice; the literal reading is now polite too
    // why: doesn't follow it ← I don't know = 分からない, taken literally; wants it explained ← the next speaker asks
    //   “what is it exactly?”, moved onto Nana
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'dontknow', seg: [126.9, 133.2],
      stem: 'What is Nana doing with “Michael, I don’t know about this”?',
      choices: ['Gently showing doubts about the plan', 'Politely saying she doesn’t follow it',
                'Asking him to go over it once more'], a: 0,
      cue: '名前を呼んだあと、Michael がどう返すか。',
      line: 'Michael, *I don’t know about this*. — Nana, I really think…',
      said: '「これはどうかしら」と祖母が言い、彼は「パパも望むはず」と説得にかかる。',
      mean: 'I don’t know about this ＝ 気が進まない。やんわりした反対。',
      trap: '「知らない、分からない」と取りやすい。about this が付くと、内容への疑い。',
      use: 'I don’t know about this restaurant.（この店、どうかなあ）' },

    // R fix: V2, “knows medicine sells better” was weak; now “paper is dying” (“in this economy” + “doesn't have to be
    //   paper”)
    // why: has a bigger plan ← “doesn't have to be paper” heard as ambition; paper is dying ← “in this economy” and
    //   “doesn't have to be paper” tied into a view he never states
    { id: 'i2', skill: 'infer', level: 'B2', point: 'paper', seg: [134.9, 145],
      stem: 'What does Michael’s answer to “what specifically?” show?',
      choices: ['He hasn’t settled on any product yet', 'He has a bigger range of products planned',
                'He thinks paper is a dying business'], a: 0,
      cue: '答えの最初の一文と、そのあとの相手の反応。',
      line: 'It *doesn’t have to be paper*. We could sell medicine and other… — See, this is what concerns me.',
      said: '「紙じゃなくてもいい。薬とか、ほかの…」と言い、相手は「そこが心配なの」と返す。',
      mean: '紙の会社の売り込みなのに、売る物さえ決まっていない。相手の一言がそれを確かめる。',
      trap: '「紙に限らない」は野心にも聞こえるが、言葉が途中で止まり、相手も不安を口にする。',
      use: 'It doesn’t have to be today.（今日じゃなくてもいいよ）' },

    // R fix: V2, the key was the only choice about doubts; now a second doubt choice in the other direction
    // why: eases her doubts ← “doesn't have to be paper” heard as flexibility; curious ← concern = 関心 (the katakana
    //   sense), and “medicine” heard as the new topic she picks up
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'paper', seg: [138, 145],
      stem: 'How does the next speaker take Michael’s answer about what to sell?',
      choices: ['It confirms her doubts about him', 'It eases her doubts about him a little',
                'It makes her curious about the medicine'], a: 0,
      cue: '「See」で始まる返事。何をどう感じたと言うか。',
      line: '*See, this is what concerns me.*',
      said: '彼の「紙じゃなくてもいい」を聞いて、「ほら、そこが心配なのよ」と言う。',
      mean: '文頭の See ＝「ほらね」。心配していたことが当たった、という反応。',
      trap: 'see を「見る」と取ると意味がつかめない。concern は「関心」でなく「心配」。',
      use: 'See, that’s what worries me.（ほら、そこが心配なんだよ）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'much', seg: [144.7, 148.7],
      stem: 'Type the end: “We could just give him a chance. ___.” (4 words)', answer: "it's not much money",
      cue: '「a chance」のすぐあと。短い4語。',
      line: 'We could just give him a chance. *It’s not much money.*',
      said: '「チャンスをあげてもいいじゃない。たいした額じゃないし」と味方する。',
      mean: 'not much ＝ たいした量ではない。not の t が弱く、much とつながる。',
      trap: 'not の t が消えて「ナッマッチ」に聞こえる。否定は残っている。',
      use: 'Don’t worry, it’s not much.（気にしないで、たいしたものじゃないから）' },

    // R fix: K7/C7, the key was the longest by far; shortened
    // why: less than before ← more/less both fit “than I originally asked”, “more” half caught; already spent it ←
    //   “originally asked” heard as money he got before
    { id: 'h5', skill: 'humor', level: 'C1', point: 'more', reveals: ['much'], seg: [144.7, 152.6],
      stem: 'Why does Michael’s next request get a laugh?',
      choices: ['It follows a claim that it’s not much money', 'He asks for less than before, which seems odd',
                'He admits he has already spent the first amount'], a: 0,
      cue: '味方の一言の直後。彼が頼む額の向き。',
      line: 'It’s not much money. — Well, this might not be the right time, but *I need more than I originally asked*.',
      said: '味方の「たいした額じゃない」の直後に、「最初より多く必要で」と言い出す。',
      mean: '自分で前置きするとおり、最悪のタイミング。味方の言葉を自分でつぶしている。',
      trap: 'originally asked を前にもらったお金と取りやすいが、まだ何ももらっていない。',
      use: 'This might be bad timing, but…（タイミングが悪いかもしれないけど…）' },

    // R fix: S1/V2, “corrects Michael about what it is” pointed at “investment club”, which the key echoed; the stem
    //   now names only the moment
    // why: flyers ← ハンドアウト = 配布資料, a katakana false friend; only people they know ← the family frame of the scene
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'handout', reveals: ['more'], seg: [150.2, 156.3],
      stem: 'After Michael asks for more, what is the club’s reply getting at?',
      choices: ['They invest for a return, not give money away', 'They hand out no flyers or papers to people',
                'They only put money into people they know'], a: 0,
      cue: '「isn’t a」と「it’s an」の二つを比べて。',
      line: 'This isn’t a *handout* club. It’s an *investment* club.',
      said: '彼が増額を頼むと、「ここは施しのクラブじゃない、投資クラブなの」と返される。',
      mean: 'handout ＝ ただで配るお金、施し。投資なら見返りが要る、ということ。',
      trap: 'カタカナのハンドアウトは配布資料。英語の handout はお金や物の施しにも使う。',
      use: 'I don’t want a handout, just a chance.（施しじゃなく、チャンスがほしい）' },

    // R fix: V2/K6, the key was the only two-part, kind choice; now each choice pairs a feeling with a stance
    // why: still deciding ← the soft words (“I love you… I do”) read as hesitation, the Japanese frame; cold ← a no after
    //   a request for more read as annoyance, the “I love you” lost
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'love', reveals: ['outcome'], seg: [156.1, 163.6],
      stem: 'How does Nana come across as she gives her answer?',
      choices: ['Loving, but firm that it’s a no', 'Loving, but still making up her mind',
                'Cold, and annoyed at being asked again'], a: 0,
      cue: '愛情の言葉のあとに続く、短い言葉。',
      line: 'I love you, Michael. I do. Okay? *But no. I mean it. No.*',
      said: '「愛してるわ、本当よ。でも、だめ。本気よ。だめ」と言う。',
      mean: '愛情を先に言ってから断る。I mean it で、迷いではないことをはっきりさせている。',
      trap: '優しい言葉が続くと迷っているように聞こえるが、I mean it は「本気で言っている」。',
      use: 'I love you, but no. I mean it.（大好きだけど、だめ。本気だよ）' },
  ]
};
