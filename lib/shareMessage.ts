const SHARE_MESSAGE_LINES = [
  "2025학년도 상명대학교 디자인대학 커뮤니케이션디자인전공 졸업전시회에 초대합니다!",
  "",
  "2025.11.14(금)-11.18(화)",
  "더 서울라이티움 제1전시장",
  "금요일 17:00 - 19:00",
  "토-화요일 11:00 - 19:00",
];

const SHARE_MESSAGE_BODY = SHARE_MESSAGE_LINES.join("\n");

export const buildShareMessage = (recipient?: string) => {
  const trimmed = recipient?.trim();
  const prefix = trimmed ? `${trimmed}님,\n` : "";
  return `${prefix}${SHARE_MESSAGE_BODY}`;
};
