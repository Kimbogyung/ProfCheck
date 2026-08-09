export type DailyStatusEntry = {
  date: string;
  status: "ON" | "OFF";
  updatedBy: string | null;
  updatedByNickname: string | null;
  updatedAt: string | null;
};

export type TimeOffEntry = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  createdBy: string;
  createdByNickname: string | null;
  updatedBy: string | null;
};
