
export type THeroButton = {
    label: string;
    link: string;
    variant?: "primary" | "secondary" | "outline";
};

export type THeroColors = {
    titleColor: string;      // e.g., "#FFFFFF"
    subtitleColor: string;   // e.g., "#F59E0B"
    descriptionColor: string; // e.g., "#E5E7EB"
    buttonTextColor: string;  // e.g., "#1F2937"
};

export type THero = {
    title: string;
    highlightedTitle?: string; // "With Artisan Diyas" (yellow text)
    description: string;
    image: string;            // Background image URL
    buttons: THeroButton[];
    colors: THeroColors;
    overlayOpacity?: number;  // 0-1 for image overlay (darkness)
    textAlignment?: "left" | "center" | "right";
    isActive: boolean;
    order: number;            // For carousel ordering
    createdAt?: Date;
    updatedAt?: Date;
};