"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

/**
 * A <Link> whose same-page jumps always work.
 *
 * Next's router does nothing when you click a link to the URL you are
 * already on — so "/#services" went dead once the address bar said
 * "/#services", and the logo did nothing on the homepage. For links that
 * point at the current page we scroll ourselves; everything else is a
 * normal client-side navigation.
 */
export default function HashLink({ href, onClick, ...rest }: Props) {
  const pathname = usePathname();

  function handle(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    const [path, hash] = href.split("#");
    if ((path || "/") !== pathname) return; // another page: normal navigation

    const target = hash ? document.getElementById(hash) : null;
    if (hash && !target) return; // unknown anchor: let the browser deal with it

    e.preventDefault();
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
    if (target) target.scrollIntoView({ behavior, block: "start" });
    else window.scrollTo({ top: 0, behavior });
    window.history.replaceState(null, "", href);
  }

  return <Link href={href} onClick={handle} {...rest} />;
}
