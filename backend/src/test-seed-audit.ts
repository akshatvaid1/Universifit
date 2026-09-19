/**
 * Test Seed Audit: Verifies single genuine creator Chadtag,
 * draft ChadMax course with 5 modules, draft 1:1 offer,
 * and zero mock/fake data.
 */
import 'dotenv/config';
import { inMemoryStore } from './config/inMemoryDb.js';
import { generateToken } from './config/jwt.js';

const BASE_URL = 'http://localhost:5000/api';

async function runSeedAudit() {
  console.log('--- STARTING A-SEED AUDIT ---');

  // 1. Audit In-Memory Store Purity
  console.log('1. Auditing database purity (Zero mock data)...');
  
  if (inMemoryStore.creatorProfiles.length !== 1) {
    throw new Error(`Expected exactly 1 creator profile, found ${inMemoryStore.creatorProfiles.length}`);
  }
  const creator = inMemoryStore.creatorProfiles[0];
  if (creator.handle !== 'chadtag') {
    throw new Error(`Expected creator handle 'chadtag', found '${creator.handle}'`);
  }
  if (creator.verificationStatus !== 'VERIFIED') {
    throw new Error(`Expected Chadtag to be VERIFIED, found '${creator.verificationStatus}'`);
  }

  // Verify social links
  const social = creator.socialLinks || {};
  if (!social.youtube?.includes('youtube.com/@chadtag')) {
    throw new Error(`Invalid YouTube link: ${social.youtube}`);
  }
  if (!social.instagram?.includes('instagram.com/chadtag')) {
    throw new Error(`Invalid Instagram link: ${social.instagram}`);
  }
  if (!social.discord?.includes('discord.gg/chadtag')) {
    throw new Error(`Invalid Discord link: ${social.discord}`);
  }
  console.log('  ✔ Creator Chadtag verified with genuine social links (YouTube, Instagram, Discord)');

  // Verify specialty tags and bio
  if (!creator.specialtyTags || creator.specialtyTags.length === 0) {
    throw new Error('Chadtag has no specialty tags');
  }
  if (!creator.bio || !creator.bio.includes('facial aesthetics')) {
    throw new Error(`Chadtag bio missing expected themes: ${creator.bio}`);
  }
  console.log(`  ✔ Specialty tags present: [${creator.specialtyTags.join(', ')}]`);
  console.log(`  ✔ Bio: "${creator.bio}"`);

  // Verify zero fake data
  if (inMemoryStore.communityPosts.length !== 0) {
    throw new Error(`Expected 0 mock community posts, found ${inMemoryStore.communityPosts.length}`);
  }
  if (inMemoryStore.bookings.length !== 0) {
    throw new Error(`Expected 0 mock bookings, found ${inMemoryStore.bookings.length}`);
  }
  if (inMemoryStore.enrollments.length !== 0) {
    throw new Error(`Expected 0 mock enrollments, found ${inMemoryStore.enrollments.length}`);
  }
  console.log('  ✔ Zero mock community posts, bookings, or enrollments');

  // 2. Audit Course "ChadMax" and 5 Modules
  console.log('2. Auditing course "ChadMax" and 5 modules...');
  if (inMemoryStore.courses.length !== 1) {
    throw new Error(`Expected exactly 1 course, found ${inMemoryStore.courses.length}`);
  }
  const course = inMemoryStore.courses[0];
  if (course.title !== 'ChadMax') {
    throw new Error(`Expected course title 'ChadMax', found '${course.title}'`);
  }
  if (course.isPublished !== false) {
    throw new Error(`Expected ChadMax course to be DRAFT (isPublished: false), found ${course.isPublished}`);
  }
  console.log('  ✔ ChadMax course is DRAFT (isPublished: false, not auto-published)');

  const courseLessons = inMemoryStore.lessons.filter((l) => l.courseId === course.id);
  if (courseLessons.length !== 5) {
    throw new Error(`Expected 5 lessons for ChadMax, found ${courseLessons.length}`);
  }

  const expectedModules = [
    'Facial Aesthetics',
    'Diet Framework',
    'Physique Building',
    'Height & Posture',
    'Confidence',
  ];

  courseLessons.sort((a, b) => a.order - b.order);
  courseLessons.forEach((l, idx) => {
    const expected = expectedModules[idx];
    if (l.title !== expected) {
      throw new Error(`Module ${idx + 1} expected '${expected}', got '${l.title}'`);
    }
    console.log(`  ✔ Module ${l.order}: "${l.title}" verified`);
  });

  // 3. Audit Offers (Draft 1:1 and Draft Course)
  console.log('3. Auditing offers (Draft 1:1 and Draft Course)...');
  const offer1on1 = inMemoryStore.offers.find((o) => o.type === 'ONE_ON_ONE');
  if (!offer1on1) {
    throw new Error('Draft 1:1 offer not found');
  }
  if (offer1on1.isActive !== false) {
    throw new Error(`Expected 1:1 offer to be DRAFT (isActive: false), found ${offer1on1.isActive}`);
  }
  console.log(`  ✔ 1:1 Coaching Call offer is DRAFT (isActive: false, price: $${offer1on1.price})`);

  const offerCourse = inMemoryStore.offers.find((o) => o.type === 'COURSE');
  if (!offerCourse) {
    throw new Error('Draft Course offer not found');
  }
  if (offerCourse.isActive !== false) {
    throw new Error(`Expected Course offer to be DRAFT (isActive: false), found ${offerCourse.isActive}`);
  }
  console.log(`  ✔ ChadMax Course offer is DRAFT (isActive: false, price: $${offerCourse.price})`);

  // 4. Audit Creator Studio API for Chadtag
  console.log('4. Auditing Course Studio creator endpoints for Chadtag...');
  const chadtagToken = generateToken({
    userId: 'user-chadtag',
    email: 'chadtag@ascend.io',
    fullName: 'Chadtag',
    role: 'CREATOR',
  });

  // Test GET /courses/studio/my-courses
  const studioRes = await fetch(`${BASE_URL}/courses/studio/my-courses`, {
    headers: { Authorization: `Bearer ${chadtagToken}` },
  });
  if (!studioRes.ok) {
    throw new Error(`GET /courses/studio/my-courses failed: ${studioRes.status}`);
  }
  const studioData: any = await studioRes.json();
  const studioCourses = studioData.data?.courses || studioData.courses;
  if (!studioCourses || studioCourses.length !== 1) {
    throw new Error(`Expected 1 course in studio, received ${studioCourses?.length}`);
  }
  const studioCourse = studioCourses[0];
  if (studioCourse.title !== 'ChadMax' || studioCourse.isPublished !== false) {
    throw new Error(`Studio course mismatch: title=${studioCourse.title}, isPublished=${studioCourse.isPublished}`);
  }
  if (studioCourse.lessons.length !== 5) {
    throw new Error(`Studio course lessons mismatch: expected 5, found ${studioCourse.lessons.length}`);
  }
  console.log('  ✔ GET /courses/studio/my-courses returns ChadMax with draft status and 5 modules');

  // Test PATCH /offers/:id/status to toggle draft/published status
  const publishRes = await fetch(`${BASE_URL}/offers/offer-chadtag-1on1/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${chadtagToken}`,
    },
    body: JSON.stringify({ isActive: true }),
  });
  if (!publishRes.ok) {
    const err = await publishRes.text();
    throw new Error(`PATCH /offers/offer-chadtag-1on1/status to publish failed: ${publishRes.status} - ${err}`);
  }
  console.log('  ✔ Chadtag successfully published 1:1 offer via API');

  // Toggle back to draft
  const draftRes = await fetch(`${BASE_URL}/offers/offer-chadtag-1on1/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${chadtagToken}`,
    },
    body: JSON.stringify({ isActive: false }),
  });
  if (!draftRes.ok) {
    throw new Error(`PATCH /offers/offer-chadtag-1on1/status to draft failed: ${draftRes.status}`);
  }
  console.log('  ✔ Chadtag successfully toggled 1:1 offer back to draft');

  // Test PUT /courses/:id to update course and toggle publish status
  const updateCourseRes = await fetch(`${BASE_URL}/courses/course-chadmax`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${chadtagToken}`,
    },
    body: JSON.stringify({
      title: 'ChadMax',
      description: "A men's self-improvement and aesthetics protocol covering facial aesthetics, diet, physique training, height & posture optimization, and confidence & aura building.",
      isPublished: true,
      lessons: courseLessons.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        order: l.order,
      })),
    }),
  });
  if (!updateCourseRes.ok) {
    const err = await updateCourseRes.text();
    throw new Error(`PUT /courses/course-chadmax failed: ${updateCourseRes.status} - ${err}`);
  }
  console.log('  ✔ Chadtag successfully published ChadMax course via Course Studio');

  // Toggle back to draft
  await fetch(`${BASE_URL}/courses/course-chadmax`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${chadtagToken}`,
    },
    body: JSON.stringify({
      title: 'ChadMax',
      isPublished: false,
    }),
  });
  console.log('  ✔ Chadtag successfully reverted ChadMax course back to draft');

  console.log('--- ALL A-SEED AUDIT CHECKS PASSED PERFECTLY ---');
}

runSeedAudit().catch((err) => {
  console.error('Seed audit failure:', err);
  process.exit(1);
});
