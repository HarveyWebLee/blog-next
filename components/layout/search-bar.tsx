"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { Search } from "lucide-react";

import { useClientDictionary } from "@/lib/hooks/use-client-dictionary";

export function SearchBar({ lang }: { lang: string }) {
  const dict = useClientDictionary(lang);
  const t = (dict as { layout?: { searchBar?: Record<string, string> } })?.layout?.searchBar;
  const [isOpen, setIsOpen] = useState(false);
  const onClose = () => setIsOpen(false);

  if (!t) return null;

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
          {(onCloseModal) => (
            <>
              <ModalHeader className="flex flex-col gap-1">{t.title}</ModalHeader>
              <ModalBody>
                <Input type="text" placeholder={t.placeholder} />
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="bordered"
                  onPress={onCloseModal}
                  className="font-semibold tracking-wide"
                >
                  {t.cancel}
                </Button>
                <Button color="primary" variant="shadow" onPress={onCloseModal} className="font-semibold tracking-wide">
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
