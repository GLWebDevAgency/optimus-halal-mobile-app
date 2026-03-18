"use client";

import { reviews } from "@/@data/reviews";
import { SectionContainer } from "@/components/layout/section-container";
import { SectionHeader } from "@/components/layout/section-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Testimonials() {
  return (
    <SectionContainer>
      <SectionHeader
        subTitle="TÉMOIGNAGES"
        title="Ils nous font confiance"
      />

      <div className="mt-12">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="mx-auto w-full max-w-6xl"
        >
          <CarouselContent className="-ml-4">
            {reviews.map((review) => (
              <CarouselItem
                key={review.name}
                className="pl-4 md:basis-1/2 lg:basis-1/3"
              >
                <Card className="h-full transition-all duration-300 hover:border-gold/20">
                  <CardContent className="flex h-full flex-col gap-4 pt-2">
                    {/* Stars */}
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "size-4",
                            i < review.rating
                              ? "fill-primary text-primary"
                              : "fill-muted text-muted"
                          )}
                        />
                      ))}
                    </div>

                    {/* Quote */}
                    <blockquote className="flex-1 text-sm leading-relaxed text-muted-foreground">
                      &ldquo;{review.quote}&rdquo;
                    </blockquote>

                    {/* Author */}
                    <div className="flex items-center gap-3 border-t border-border pt-4">
                      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {review.initials}
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          {review.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {review.role}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="-left-4 hidden md:flex" />
          <CarouselNext className="-right-4 hidden md:flex" />
        </Carousel>
      </div>
    </SectionContainer>
  );
}
