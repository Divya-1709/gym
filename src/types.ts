export interface Client {
  _id?: string;
  name: string;
  contactNumber?: string;
  email?: string;
}

export interface MembershipItem {
  membershipType: "Membership" | "Personal Training" | "Group Class" | string;
  packageName?: string;
  joiningDate?: string;
  endDate?: string;
  sessions?: number;
  price?: number;
  amountPaid?: number;
  paymentMode?: string;
  status?: string;
  appointTrainer?: string;
}
