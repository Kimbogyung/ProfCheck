export type DailyStatusEntry = {
  date: string;
  status: "ON" | "OFF";
  updatedBy: string | null;
  updatedAt: string | null;
};

export type TimeOffEntry = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  createdBy: string;
  updatedBy: string | null;
};
