import { redirect } from "next/navigation";

// The coordinator's queue is the product's home. Setup lives at /demo.
export default function Home() {
  redirect("/coordinator");
}
