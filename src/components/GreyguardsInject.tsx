// Renders a DMMI training inject (fake social post, message thread, forum
// thread, official document, press release, etc.) directly from scenario JSON.
import { forwardRef } from "react";

export type InjectTemplate =
  | "social-dark"
  | "messaging"
  | "professional"
  | "forum"
  | "news-comments"
  | "reviews"
  | "document"
  | "press-release";

export interface InjectVisualSpec {
  template: InjectTemplate | string;
  label?: string;
  data?: Record<string, any>;
}

export const INJECT_TEMPLATE_KEYS: InjectTemplate[] = [
  "social-dark",
  "messaging",
  "professional",
  "forum",
  "news-comments",
  "reviews",
  "document",
  "press-release",
];

const Stars = ({ n = 0 }: { n?: number }) => {
  const full = Math.max(0, Math.min(5, Math.round(n)));
  return (
    <span className="stars">
      {"★".repeat(full)}
      {"☆".repeat(5 - full)}
    </span>
  );
};

type TplProps = { data?: Record<string, any> };

function SocialDark({ data = {} }: TplProps) {
  const {
    displayName = "Display Name",
    handle = "@handle",
    verified = false,
    avatarInitials,
    avatarColor = "#546471",
    timestamp = "now",
    body = "",
    comments = "0",
    reposts = "0",
    likes = "0",
    bookmarks = "0",
  } = data;
  const initials = avatarInitials || String(displayName).slice(0, 2).toUpperCase();
  return (
    <div className="tpl-social-dark">
      <div className="row">
        <div className="avatar" style={{ background: avatarColor }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <div className="meta">
            <span className="name">{displayName}</span>
            {verified && <span className="check">✓</span>}
            <span className="handle">{handle}</span>
            <span className="dot">·</span>
            <span className="time">{timestamp}</span>
          </div>
          <div className="body">{body}</div>
          <div className="engage">
            <span>💬 {comments}</span>
            <span>🔁 {reposts}</span>
            <span>❤️ {likes}</span>
            <span>🔖 {bookmarks}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Messaging({ data = {} }: TplProps) {
  const { groupName = "Group Chat", messages = [] } = data;
  return (
    <div className="tpl-messaging">
      <div className="hdr">{groupName}</div>
      <div className="msgs">
        {(messages as any[]).map((m, i) => (
          <div className="bubble" key={i}>
            <div className="sender" style={{ color: m.color || "#333" }}>
              {m.sender || "Sender"}
            </div>
            <div className="text">{m.text || ""}</div>
            <div className="ts">{m.timestamp || ""}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Professional({ data = {} }: TplProps) {
  const {
    name = "Full Name",
    title = "Job title · Company",
    timestamp = "now",
    body = "",
    reactions = "0",
    comments = "0",
    reposts = "0",
  } = data;
  return (
    <div className="tpl-professional">
      <div className="row">
        <div className="avatar">{String(name).slice(0, 2).toUpperCase()}</div>
        <div className="who">
          <div className="name">{name}</div>
          <div className="title">{title}</div>
          <div className="time">{timestamp}</div>
        </div>
      </div>
      <div className="body">{body}</div>
      <div className="engage">
        {reactions} reactions · {comments} comments · {reposts} reposts
      </div>
      <div className="actions">
        <span>👍 Like</span>
        <span>💬 Comment</span>
        <span>🔁 Repost</span>
        <span>➤ Send</span>
      </div>
    </div>
  );
}

function Forum({ data = {} }: TplProps) {
  const {
    subreddit = "r/example",
    title = "Post title",
    author = "u/anon",
    flair,
    score = "0",
    body = "",
    topComment,
  } = data;
  return (
    <div className="tpl-forum">
      <div className="sub">{subreddit}</div>
      <div className="row">
        <div className="votes">
          <span className="arrow">▲</span>
          {score}
          <span className="arrow">▼</span>
        </div>
        <div style={{ flex: 1 }}>
          <div className="title">
            {title}
            {flair && <span className="flair">{flair}</span>}
          </div>
          <div className="byline">Posted by {author}</div>
          <div className="body">{body}</div>
          {topComment && (
            <div className="comment">
              <div className="cauthor">{topComment.author || "u/commenter"}</div>
              <div className="ctext">{topComment.text || ""}</div>
              <div className="cscore">▲ {topComment.score || "0"}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NewsComments({ data = {} }: TplProps) {
  const { headline = "Article headline", commentCount = "0", comments = [] } = data;
  return (
    <div className="tpl-news">
      <div className="headline">{headline}</div>
      <div className="chdr">Comments ({commentCount})</div>
      {(comments as any[]).map((c, i) => (
        <div className="comment" key={i}>
          <div className="cmeta">
            <b>{c.username || "user"}</b>
            <span className="ts">{c.timestamp || ""}</span>
          </div>
          <div className="ctext">{c.text || ""}</div>
        </div>
      ))}
    </div>
  );
}

function Reviews({ data = {} }: TplProps) {
  const { businessName = "Company Name", overallRating = 0, totalReviews = "0", reviews = [] } = data;
  return (
    <div className="tpl-reviews">
      <div className="top">
        <div>
          <div className="bname">{businessName}</div>
          <div className="summary">{totalReviews} reviews</div>
        </div>
        <Stars n={Number(overallRating)} />
      </div>
      {(reviews as any[]).map((r, i) => (
        <div className="review" key={i}>
          <div className="rrow">
            <span className="rauthor">{r.author || "Reviewer"}</span>
            <span className="rdate">{r.date || ""}</span>
          </div>
          <div className="rstars">
            <Stars n={Number(r.rating)} />
          </div>
          <div className="rtext">{r.text || ""}</div>
        </div>
      ))}
    </div>
  );
}

function DocumentTpl({ data = {} }: TplProps) {
  const {
    docTitle = "OFFICIAL NOTICE",
    refNumber = "Ref: 0000-0000",
    bannerText,
    dateLine,
    recipientLine,
    body = "",
    signOff = "",
    logoUrl,
  } = data;
  return (
    <div className="tpl-document">
      <div className="hdrrow">
        <div className="crest">
          {logoUrl ? <img src={logoUrl} alt="" /> : <>[LOGO<br />PLACEHOLDER]</>}
        </div>
        <div>
          <div className="doctitle">{docTitle}</div>
          <div className="ref">{refNumber}</div>
        </div>
      </div>
      {bannerText && <div className="banner">{bannerText}</div>}
      {dateLine && <div className="dateline">{dateLine}</div>}
      {recipientLine && <div className="recipient">{recipientLine}</div>}
      <div className="body">{body}</div>
      <div className="signoff">{signOff}</div>
    </div>
  );
}

function PressRelease({ data = {} }: TplProps) {
  const {
    headline = "Press release headline",
    dateline = "",
    body = "",
    notesHeader,
    notesBody,
    contactLine,
    logoUrl,
  } = data;
  return (
    <div className="tpl-press">
      <div className="hdrrow">
        <div className="crest">
          {logoUrl ? <img src={logoUrl} alt="" /> : <>[LOGO<br />PLACEHOLDER]</>}
        </div>
        <div className="fir">FOR IMMEDIATE RELEASE</div>
      </div>
      <div className="headline">{headline}</div>
      <div className="dateline">{dateline}</div>
      <div className="body">{body}</div>
      {notesHeader && (
        <>
          <div className="notes-hdr">{notesHeader}</div>
          <div className="notes-body">{notesBody}</div>
        </>
      )}
      {contactLine && <div className="contact">{contactLine}</div>}
    </div>
  );
}

const TEMPLATES: Record<string, (p: TplProps) => JSX.Element> = {
  "social-dark": SocialDark,
  messaging: Messaging,
  professional: Professional,
  forum: Forum,
  "news-comments": NewsComments,
  reviews: Reviews,
  document: DocumentTpl,
  "press-release": PressRelease,
};

export const hasInjectTemplate = (template?: string) => !!template && !!TEMPLATES[template];

export const Inject = forwardRef<HTMLDivElement, { template: string; data?: Record<string, any> }>(
  function Inject({ template, data }, ref) {
    const Cmp = TEMPLATES[template];
    if (!Cmp) {
      return (
        <div ref={ref} className="ggi-root ggi err-banner">
          Unknown template: "{template}". Valid keys: {Object.keys(TEMPLATES).join(", ")}
        </div>
      );
    }
    return (
      <div ref={ref} className="ggi-root">
        <Cmp data={data} />
      </div>
    );
  }
);

export function InjectList({ injects = [] }: { injects?: InjectVisualSpec[] }) {
  return (
    <>
      {injects.map((item, i) => (
        <div key={i} style={{ marginBottom: 24 }}>
          {item.label && (
            <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {item.label}
            </div>
          )}
          <Inject template={item.template} data={item.data} />
        </div>
      ))}
    </>
  );
}

export async function downloadInjectPNG(node: HTMLElement | null, filename = "inject.png") {
  if (!node) return;
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(node, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  });
}
