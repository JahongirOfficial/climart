import * as React from "react";
import { SuccessModal, ModalType } from "@/components/ui/success-modal";

interface ModalState {
    open: boolean;
    message: string;
    title?: string;
    type: ModalType;
    autoClose?: boolean;
    autoCloseDelay?: number;
}

interface ModalContextType {
    showModal: (options: {
        message: string;
        title?: string;
        type?: ModalType;
        autoClose?: boolean;
        autoCloseDelay?: number;
    }) => void;
    showSuccess: (message: string, title?: string) => void;
    showError: (message: string, title?: string) => void;
    showWarning: (message: string, title?: string) => void;
    hideModal: () => void;
}

const ModalContext = React.createContext<ModalContextType | undefined>(
    undefined
);

const initialState: ModalState = {
    open: false,
    message: "",
    type: "success",
};

export function ModalProvider({ children }: { children: React.ReactNode }) {
    const [modalState, setModalState] = React.useState<ModalState>(initialState);

    const showModal = React.useCallback(
        ({
            message,
            title,
            type = "success",
            autoClose = true,
            autoCloseDelay = 2000,
        }: {
            message: string;
            title?: string;
            type?: ModalType;
            autoClose?: boolean;
            autoCloseDelay?: number;
        }) => {
            setModalState({
                open: true,
                message,
                title,
                type,
                autoClose,
                autoCloseDelay,
            });
        },
        []
    );

    const showSuccess = React.useCallback(
        (message: string, title?: string) => {
            showModal({ message, title, type: "success" });
        },
        [showModal]
    );

    const showError = React.useCallback(
        (message: string, title?: string) => {
            showModal({ message, title, type: "error", autoClose: false });
        },
        [showModal]
    );

    const showWarning = React.useCallback(
        (message: string, title?: string) => {
            showModal({ message, title, type: "warning", autoCloseDelay: 3000 });
        },
        [showModal]
    );

    const hideModal = React.useCallback(() => {
        setModalState((prev) => ({ ...prev, open: false }));
    }, []);

    const value = React.useMemo(
        () => ({
            showModal,
            showSuccess,
            showError,
            showWarning,
            hideModal,
        }),
        [showModal, showSuccess, showError, showWarning, hideModal]
    );

    return (
        <ModalContext.Provider value={value}>
            {children}
            <SuccessModal
                open={modalState.open}
                onClose={hideModal}
                message={modalState.message}
                title={modalState.title}
                type={modalState.type}
                autoClose={modalState.autoClose}
                autoCloseDelay={modalState.autoCloseDelay}
            />
        </ModalContext.Provider>
    );
}

export function useModal() {
    const context = React.useContext(ModalContext);
    if (context === undefined) {
        throw new Error("useModal must be used within a ModalProvider");
    }
    return context;
}
