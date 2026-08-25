import { Types } from "mongoose";
import { Event } from "./event.model.js";

interface CreateEventInput {
  name: string;
  description: string;
  category: string;
  venue: string;
  city: string;
  eventDate: string;
  startTime: string;
  endTime?: string;
  banner?: string;
  capacity: number;
}

interface UpdateEventInput {
  name?: string;
  description?: string;
  category?: string;
  venue?: string;
  city?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  banner?: string;
  capacity?: number;
}


export async function createEvent(
  input: CreateEventInput,
  userId: string
) {
  const eventDate = new Date(input.eventDate);

  if (Number.isNaN(eventDate.getTime())) {
    throw new Error("Invalid event date");
  }

  if (eventDate <= new Date()) {
    throw new Error("Event date must be in the future");
  }

  const event = await Event.create({
    name: input.name,
    description: input.description,
    category: input.category,
    venue: input.venue,
    city: input.city,
    eventDate,
    startTime: input.startTime,
    endTime: input.endTime,
    banner: input.banner,
    capacity: input.capacity,
    status: "DRAFT",
    createdBy: new Types.ObjectId(userId),
  });

  return event;
}

export async function getPublishedEvents(){
    return Event.find({
        status:"PUBLISHED",
        eventDate:{
            $gt: new Date(),
        },
    })
    .sort({eventDate: 1})
    .select(
        "name description category venue city eventDate startTime endTime banner capacity status createdBy"
    )
    .lean();
}

export async function getPublishedEventById(
    eventId:string
){
    if(!Types.ObjectId.isValid(eventId)){
        throw new Error("Invalid event ID");
    }
     const event = await Event.findOne({
    _id: eventId,
    status: "PUBLISHED",
    eventDate: {
      $gt: new Date(),
    },
  })
    .select(
      "name description category venue city eventDate startTime endTime banner capacity status createdBy"
    )
    .lean();

  if (!event) {
    throw new Error("Event not found");
  }

  return event;
}

export async function getMyEvents(userId: string) {
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  return Event.find({
    createdBy: new Types.ObjectId(userId),
  })
    .sort({ createdAt: -1 })
    .lean();
}

export async function updateEvent(
  eventId: string,
  userId: string,
  input: UpdateEventInput
) {
  if (!Types.ObjectId.isValid(eventId)) {
    throw new Error("Invalid event ID");
  }

  if (!Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  const event = await Event.findById(eventId);

  if (!event) {
    throw new Error("Event not found");
  }

  const isOwner =
    event.createdBy.toString() === userId;

  if (!isOwner) {
    throw new Error(
      "You do not have permission to modify this event"
    );
  }

  if (input.eventDate) {
    const eventDate = new Date(input.eventDate);

    if (Number.isNaN(eventDate.getTime())) {
      throw new Error("Invalid event date");
    }

    if (eventDate <= new Date()) {
      throw new Error(
        "Event date must be in the future"
      );
    }

    event.eventDate = eventDate;
  }

  if (input.name !== undefined) {
    event.name = input.name;
  }

  if (input.description !== undefined) {
    event.description = input.description;
  }

  if (input.category !== undefined) {
    event.category = input.category;
  }

  if (input.venue !== undefined) {
    event.venue = input.venue;
  }

  if (input.city !== undefined) {
    event.city = input.city;
  }

  if (input.startTime !== undefined) {
    event.startTime = input.startTime;
  }

  if (input.endTime !== undefined) {
    event.endTime = input.endTime;
  }

  if (input.banner !== undefined) {
    event.banner = input.banner;
  }

  if (input.capacity !== undefined) {
    event.capacity = input.capacity;
  }

  await event.save();

  return event;
}

export async function publishEvent(
  eventId: string,
  userId: string
) {
  if (!Types.ObjectId.isValid(eventId)) {
    throw new Error("Invalid event ID");
  }

  if (!Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  const event = await Event.findById(eventId);

  if (!event) {
    throw new Error("Event not found");
  }

  const isOwner =
    event.createdBy.toString() === userId;

  if (!isOwner) {
    throw new Error(
      "You do not have permission to publish this event"
    );
  }

  if (event.status !== "DRAFT") {
    throw new Error(
      "Only draft events can be published"
    );
  }

  if (event.eventDate <= new Date()) {
    throw new Error(
      "Cannot publish an event in the past"
    );
  }

  event.status = "PUBLISHED";

  await event.save();

  return event;
}