"use client";

import { useRef, useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDraggable } from "@heroui/modal";
import { Search, X } from "lucide-react";

import { Locale } from "@/types";

const resolveLocale = (lang?: string): Locale => {
  if (lang === "en-US" || lang === "ja-JP") return lang;
  return "zh-CN";
};

const SEARCH_TEXT: Record<
  Locale,
  { openAria: string; title: string; placeholder: string; cancel: string; confirm: string }
> = {
  "zh-CN": {
    openAria: "搜索",
    title: "搜索",
    placeholder: "请输入搜索内容",
    cancel: "取消",
    confirm: "确认",
  },
  "en-US": {
    openAria: "Search",
    title: "Search",
    placeholder: "Enter search keywords",
    cancel: "Cancel",
    confirm: "Confirm",
  },
  "ja-JP": {
    openAria: "検索",
    title: "検索",
    placeholder: "検索キーワードを入力",
    cancel: "キャンセル",
    confirm: "確認",
  },
};

export function SearchBar({ lang }: { lang: string }) {
  const locale = resolveLocale(lang);
  const t = SEARCH_TEXT[locale];
  const [isOpen, setIsOpen] = useState(false);
  const onClose = () => setIsOpen(false);
  return (
    <>
      <Button
        onPress={() => setIsOpen(true)}
        isIconOnly
        aria-label={t.openAria}
        color="primary"
        variant="flat"
        className="font-semibold"
      >
        <Search />
      </Button>

      <Modal isOpen={isOpen} size={"4xl"} onClose={onClose} backdrop="blur" placement="top">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">{t.title}</ModalHeader>
              <ModalBody>
                <Input type="text" placeholder={t.placeholder} />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="bordered" onPress={onClose} className="font-semibold tracking-wide">
                  {t.cancel}
                </Button>
                <Button color="primary" variant="shadow" onPress={onClose} className="font-semibold tracking-wide">
                  {t.confirm}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
