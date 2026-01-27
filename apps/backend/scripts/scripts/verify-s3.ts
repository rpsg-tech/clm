
import { S3Client, ListBucketsCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env from the backend root
const envPath = resolve(__dirname, '../../.env');
console.log(`Loading env from: ${envPath}`);
dotenv.config({ path: envPath });

async function verifyS3() {
    console.log('----------------------------------------');
    console.log('🔍 Starting AWS S3 Verification');
    console.log('----------------------------------------');

    const region = process.env.AWS_REGION;
    const bucket = process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    // 1. Check Env Vars
    console.log('1. Checking Environment Variables...');
    if (!region || !bucket || !accessKeyId || !secretAccessKey) {
        console.error('❌ Missig Required Env Variables:');
        console.error(`   AWS_REGION: ${region ? 'OK' : 'MISSING'}`);
        console.error(`   S3_BUCKET_NAME/AWS_S3_BUCKET: ${bucket ? 'OK' : 'MISSING'}`);
        console.error(`   AWS_ACCESS_KEY_ID: ${accessKeyId ? 'OK' : 'MISSING'}`);
        console.error(`   AWS_SECRET_ACCESS_KEY: ${secretAccessKey ? '**********' : 'MISSING'}`);
        process.exit(1);
    }
    console.log('✅ Environment Variables Present');

    // 2. Initialize Client
    console.log('\n2. Initializing S3 Client...');
    const client = new S3Client({
        region,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });

    try {
        // 3. Test Connectivity (List Buckets)
        console.log('\n3. Testing Connectivity (ListBuckets)...');
        const listCmd = new ListBucketsCommand({});
        const listRes = await client.send(listCmd);
        const bucketExists = listRes.Buckets?.some(b => b.Name === bucket);

        console.log(`✅ Successfully connected to AWS.`);
        console.log(`   Found ${listRes.Buckets?.length} buckets.`);

        if (bucketExists) {
            console.log(`✅ Bucket "${bucket}" found in account.`);
        } else {
            console.warn(`⚠️  Bucket "${bucket}" NOT found in list. (Check bucket name or permissions)`);
        }

        // 4. Test Presigned URL Generation
        console.log('\n4. Testing Presigned URL Generation...');
        const key = `test-verification-${Date.now()}.txt`;
        const putCmd = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            ContentType: 'text/plain',
        });

        const url = await getSignedUrl(client, putCmd, { expiresIn: 3600 });
        console.log('✅ Presigned URL Generated Successfully');
        console.log(`   URL: ${url.substring(0, 50)}...`);

        console.log('\n----------------------------------------');
        console.log('✅✅ VERIFICATION COMPLETE: S3 CONFIG IS VALID');
        console.log('----------------------------------------');

    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED');
        console.error('----------------------------------------');
        if (error instanceof Error) {
            console.error(`Error Name: ${error.name}`);
            console.error(`Message: ${error.message}`);
            if ((error as any).Code === 'InvalidAccessKeyId') {
                console.error('👉 Tip: Check your AWS_ACCESS_KEY_ID');
            }
            if ((error as any).Code === 'SignatureDoesNotMatch') {
                console.error('👉 Tip: Check your AWS_SECRET_ACCESS_KEY');
            }
        }
        process.exit(1);
    }
}

verifyS3();
