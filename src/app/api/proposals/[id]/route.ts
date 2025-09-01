/**
 * Individual Proposal API Routes - Modern Architecture
 * User Story: US-3.1 (Proposal Creation), US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination), H7 (Deadline Management)
 */

import { ProposalSchema, WizardProposalUpdateSchema } from '@/features/proposals/schemas';
import { fail } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/db/prisma';
import { ErrorCodes, errorHandlingService } from '@/lib/errors';
import { logError, logInfo } from '@/lib/logger';
import { formatCurrency } from '@/lib/utils';
import { Prisma } from '@prisma/client';

// ====================
// GET /api/proposals/[id] - Get individual proposal
// ====================

export const GET = createRoute(
  {
    roles: ['admin', 'manager', 'sales', 'viewer', 'System Administrator', 'Administrator'],
  },
  async ({ req, user }) => {
    const id = req.url.split('/').pop()?.split('?')[0];

    if (!id) {
      return Response.json(fail('VALIDATION_ERROR', 'Proposal ID is required'), { status: 400 });
    }
    try {
      logInfo('Fetching proposal', {
        component: 'ProposalAPI',
        operation: 'GET',
        proposalId: id,
        userId: user.id,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      const proposal = await prisma.proposal.findUnique({
        where: { id },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          sections: {
            orderBy: { order: 'asc' },
          },
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  category: true,
                },
              },
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!proposal) {
        logError('Proposal not found', null, {
          component: 'ProposalAPI',
          operation: 'GET',
          proposalId: id,
          userId: user.id,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });
        return Response.json(
          { code: ErrorCodes.DATA.NOT_FOUND, message: 'Proposal not found' },
          { status: 404 }
        );
      }

      // Transform null values to appropriate defaults before validation
      const transformedProposal = {
        ...proposal,
        description: proposal.description || '',
        metadata: proposal.metadata || {},
        customer: proposal.customer
          ? {
              ...proposal.customer,
              email: proposal.customer.email || '',
              industry: (proposal.customer as any).industry || '',
            }
          : undefined,
        title: proposal.title || 'Untitled Proposal', // Handle empty titles
        // ✅ FIXED: Handle null product relations and missing product names
        products: proposal.products
          ? proposal.products
              .filter(pp => pp.product) // Remove orphaned ProposalProduct records
              .map(pp => ({
                ...pp,
                name: pp.product?.name || `Product ${pp.productId}`, // Handle null product names
                category: pp.product?.category?.[0] || 'General', // Handle null category
              }))
          : [],
      };

      logInfo('Proposal fetched successfully', {
        component: 'ProposalAPI',
        operation: 'GET',
        proposalId: id,
        userId: user.id,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      // Validate response against schema
      const validationResult = ProposalSchema.safeParse(transformedProposal);
      if (!validationResult.success) {
        logError('Proposal schema validation failed', validationResult.error, {
          component: 'ProposalAPI',
          operation: 'GET',
          proposalId: id,
        });
        // Return the transformed proposal data anyway for now, but log the validation error
        const responsePayload = { ok: true, data: transformedProposal };
        return new Response(JSON.stringify(responsePayload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const responsePayload = { ok: true, data: validationResult.data };
      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      const processedError = errorHandlingService.processError(
        error,
        'Failed to fetch proposal',
        undefined,
        {
          component: 'ProposalAPI',
          operation: 'GET',
          proposalId: id,
          userId: user.id,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        }
      );
      throw processedError; // createRoute handles errorToJson automatically
    }
  }
);

// ====================
// PUT /api/proposals/[id] - Update proposal
// ====================

export const PUT = createRoute(
  {
    roles: ['admin', 'manager', 'sales', 'System Administrator', 'Administrator'],
    body: WizardProposalUpdateSchema, // ✅ Use wizard schema for flat payload structure
  },
  async ({ req, body, user }) => {
    const id = req.url.split('/').pop()?.split('?')[0];

    if (!id) {
      return Response.json(fail('VALIDATION_ERROR', 'Proposal ID is required'), { status: 400 });
    }

    // ✅ ADDED: Debug logging to see what's being received
    const bodyData = body as any;

    // 🔍 DEBUG: Log incoming body data
    console.log('🔍 DEBUG: Incoming body data', {
      proposalId: id,
      bodyKeys: Object.keys(bodyData),
      bodyValue: bodyData.value,
      bodyValueType: typeof bodyData.value,
      hasProductData: !!bodyData.productData,
      productDataKeys: bodyData.productData ? Object.keys(bodyData.productData) : [],
      hasChangesSummary: !!bodyData.changesSummary,
      changesSummaryValue: bodyData.changesSummary,
      bodyStringified: JSON.stringify(bodyData).substring(0, 500) + '...',
    });

    logInfo('Received proposal update request', {
      component: 'ProposalAPI',
      operation: 'PUT',
      proposalId: id,
      bodyKeys: Object.keys(bodyData || {}),
      hasTeamData: !!bodyData?.teamData,
      hasContentData: !!bodyData?.contentData,
      hasProductData: !!bodyData?.productData,
      hasSectionData: !!bodyData?.sectionData,
      hasReviewData: !!bodyData?.reviewData,
      userStory: 'US-3.2',
      hypothesis: 'H4',
    });

    // ✅ ADDED: Detailed logging of the actual body structure
    logInfo('DEBUG: Full request body structure', {
      component: 'ProposalAPI',
      operation: 'PUT',
      proposalId: id,
      bodyType: typeof bodyData,
      bodySize: bodyData ? JSON.stringify(bodyData).length : 0,
      topLevelKeys: Object.keys(bodyData || {}),
      teamDataKeys: bodyData?.teamData ? Object.keys(bodyData.teamData) : null,
      contentDataKeys: bodyData?.contentData ? Object.keys(bodyData.contentData) : null,
      productDataKeys: bodyData?.productData ? Object.keys(bodyData.productData) : null,
      sectionDataKeys: bodyData?.sectionData ? Object.keys(bodyData.sectionData) : null,
      reviewDataKeys: bodyData?.reviewData ? Object.keys(bodyData.reviewData) : null,
      productCount: bodyData?.productData?.products?.length || 0,
      userStory: 'US-3.2',
      hypothesis: 'H4',
    });

    try {
      logInfo('Updating proposal', {
        component: 'ProposalAPI',
        operation: 'PUT',
        proposalId: id,
        userId: user.id,
        updates: Object.keys(body!),
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      // ✅ FIXED: Handle wizard flat payload structure
      const {
        teamData,
        contentData,
        productData,
        sectionData,
        reviewData,
        planType,
        customer,
        customerId, // Remove customerId to prevent Prisma conflict
        changesSummary, // Extract changesSummary separately (not a Proposal field)
        ...basicFields
      } = body as any;

      // ✅ FIXED: Convert string values to appropriate types before database update
      const processedBasicFields = {
        ...basicFields,
        // Convert value to number if it's a string (common issue from form inputs)
        value: basicFields.value !== undefined ? Number(basicFields.value) : undefined,
      };

      console.log('🔍 DEBUG: Processed basic fields', {
        proposalId: id,
        basicFieldsValue: basicFields.value,
        basicFieldsValueType: typeof basicFields.value,
        processedBasicFieldsValue: processedBasicFields.value,
        processedBasicFieldsValueType: typeof processedBasicFields.value,
        basicFieldsKeys: Object.keys(basicFields),
        processedBasicFieldsKeys: Object.keys(processedBasicFields),
        changesSummary: changesSummary,
        changesSummaryType: typeof changesSummary,
      });

      const updateData: any = {
        ...processedBasicFields,
        updatedAt: new Date(),
      };

      // ✅ FIXED: Handle customer relationship properly
      if (customer && customer.id) {
        updateData.customer = {
          connect: { id: customer.id },
        };
      }

      // Convert dueDate string to Date if provided
      if (basicFields.dueDate) {
        updateData.dueDate = new Date(basicFields.dueDate);
      }

      // ✅ FIXED: Save complex nested data to metadata field
      if (teamData || contentData || productData || sectionData || reviewData || planType) {
        updateData.metadata = {
          teamData,
          contentData,
          productData,
          sectionData,
          reviewData,
          submittedAt: new Date().toISOString(),
          wizardVersion: 'modern',
          planType,
          // Store changesSummary in metadata for version snapshots
          _changesSummary: changesSummary,
        };

        // ✅ ENHANCED: Generate meaningful change summary
        const changes = [];
        if (teamData) changes.push('team assignments');
        if (contentData) changes.push('content sections');
        if (productData) changes.push('product catalog');
        if (sectionData) changes.push('proposal sections');
        if (reviewData) changes.push('review details');
        if (planType) changes.push('proposal plan');

        // ✅ ADDED: Debug logging to verify metadata is being set
        logInfo('Setting metadata for proposal update', {
          component: 'ProposalAPI',
          operation: 'PUT',
          proposalId: id,
          metadataKeys: Object.keys(updateData.metadata),
          changesSummaryInMetadata: updateData.metadata._changesSummary,
          hasTeamData: !!teamData,
          hasContentData: !!contentData,
          hasProductData: !!productData,
          hasSectionData: !!sectionData,
          hasReviewData: !!reviewData,
          hasPlanType: !!planType,
          userStory: 'US-3.2',
          hypothesis: 'H4',
        });
      }

      // ✅ ADDED: Debug logging to verify updateData structure
      logInfo('Updating proposal with data', {
        component: 'ProposalAPI',
        operation: 'PUT',
        proposalId: id,
        updateDataKeys: Object.keys(updateData),
        hasMetadata: !!updateData.metadata,
        metadataKeys: updateData.metadata ? Object.keys(updateData.metadata) : [],
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      // ✅ FIXED: Use transaction with timeout to ensure data consistency and prevent network timeouts
      const transactionStartTime = Date.now();
      logInfo('Starting proposal update transaction', {
        component: 'ProposalAPI',
        operation: 'PUT',
        proposalId: id,
        userId: user.id,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      const proposal = await prisma.$transaction(
        async tx => {
          const currentUserId = user.id;
          // 1. Update the proposal
          console.log('🔍 DEBUG: About to update proposal', {
            proposalId: id,
            updateDataKeys: Object.keys(updateData),
            updateDataValue: updateData.value,
            updateDataValueType: typeof updateData.value,
            updateDataStringified: JSON.stringify(updateData).substring(0, 300) + '...',
          });

          const updatedProposal = await tx.proposal.update({
            where: { id },
            data: updateData,
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              sections: {
                select: {
                  id: true,
                  title: true,
                  content: true,
                  order: true,
                  type: true,
                },
                orderBy: { order: 'asc' },
              },
              products: {
                select: {
                  id: true,
                  productId: true,
                  quantity: true,
                  unitPrice: true,
                  discount: true,
                  total: true,
                  configuration: true,
                  product: {
                    select: {
                      id: true,
                      name: true,
                      sku: true,
                      category: true,
                    },
                  },
                },
              },
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          });

          // 2. ✅ FIXED: Handle product data by updating ProposalProduct records
          logInfo('🔍 DEBUG: Checking product data structure', {
            component: 'ProposalAPI',
            operation: 'PUT',
            proposalId: id,
            hasProductData: !!productData,
            productDataType: typeof productData,
            productDataKeys: productData ? Object.keys(productData) : [],
            hasProductsArray: productData && productData.products,
            productsArrayType:
              productData && productData.products ? typeof productData.products : null,
            isProductsArray:
              productData && productData.products && Array.isArray(productData.products),
            productsLength:
              productData && productData.products && Array.isArray(productData.products)
                ? productData.products.length
                : 0,
            rawProductData: productData,
            userStory: 'US-3.2',
            hypothesis: 'H4',
          });

          // 🔍 DEBUG: Log detailed product data for first few products
          if (productData && productData.products && Array.isArray(productData.products)) {
            productData.products.slice(0, 3).forEach((product: any, index: number) => {
              console.log('🔍 DEBUG: Product data analysis', {
                index: index,
                productId: product.productId,
                productIdType: typeof product.productId,
                name: product.name,
                nameType: typeof product.name,
                quantity: product.quantity,
                quantityType: typeof product.quantity,
                unitPrice: product.unitPrice,
                unitPriceType: typeof product.unitPrice,
                discount: product.discount,
                discountType: typeof product.discount,
                total: product.total,
                totalType: typeof product.total,
                configuration: product.configuration,
                configurationType: typeof product.configuration,
              });
            });
          }

          if (productData && productData.products && Array.isArray(productData.products)) {
            logInfo('Processing product data for proposal update', {
              component: 'ProposalAPI',
              operation: 'PUT',
              proposalId: id,
              productCount: productData.products.length,
              productDataStructure: productData.products.map((p: any) => ({
                id: p.id,
                productId: p.productId,
                name: p.name,
                quantity: p.quantity,
                unitPrice: p.unitPrice,
                total: p.total,
                hasProductId: !!p.productId,
                hasQuantity: !!p.quantity,
                hasUnitPrice: !!p.unitPrice,
              })),
              userStory: 'US-3.2',
              hypothesis: 'H4',
            });

            // Delete existing proposal products
            await tx.proposalProduct.deleteMany({
              where: { proposalId: id },
            });

            // Create new proposal products with better validation
            let createdCount = 0;
            let skippedCount = 0;

            logInfo('Starting product creation process', {
              component: 'ProposalAPI',
              operation: 'PUT',
              proposalId: id,
              totalProductsToProcess: productData.products.length,
              userStory: 'US-3.2',
              hypothesis: 'H4',
            });

            for (const product of productData.products) {
              // ✅ FIXED: Better validation and data transformation
              const productId = product.productId;
              const quantity = Number(product.quantity) || 1;
              const unitPrice = Number(product.unitPrice) || 0;
              const discount = Number(product.discount) || 0;

              logInfo('Processing product for creation', {
                component: 'ProposalAPI',
                operation: 'PUT',
                proposalId: id,
                productData: {
                  originalId: product.id,
                  productId: productId,
                  name: product.name,
                  quantity: quantity,
                  unitPrice: unitPrice,
                  discount: discount,
                  total: product.total,
                },
                validation: {
                  hasProductId: !!productId,
                  quantityValid: quantity > 0,
                  unitPriceValid: unitPrice >= 0,
                },
                userStory: 'US-3.2',
                hypothesis: 'H4',
              });

              if (productId && quantity > 0 && unitPrice >= 0) {
                const calculatedTotal = quantity * unitPrice * (1 - discount / 100);
                const total = Number(product.total) || calculatedTotal;

                try {
                  const createdProduct = await tx.proposalProduct.create({
                    data: {
                      proposalId: id,
                      productId: productId,
                      quantity: quantity,
                      unitPrice: unitPrice,
                      discount: discount,
                      total: total,
                      configuration: product.configuration || {},
                    },
                  });
                  createdCount++;

                  logInfo('Successfully created proposal product', {
                    component: 'ProposalAPI',
                    operation: 'PUT',
                    proposalId: id,
                    createdProductId: createdProduct.id,
                    productId: productId,
                    name: product.name,
                    quantity: quantity,
                    unitPrice: unitPrice,
                    total: total,
                    userStory: 'US-3.2',
                    hypothesis: 'H4',
                  });
                } catch (createError) {
                  skippedCount++;
                  logError('Failed to create proposal product', createError, {
                    component: 'ProposalAPI',
                    operation: 'PUT',
                    proposalId: id,
                    productId: productId,
                    name: product.name,
                    userStory: 'US-3.2',
                    hypothesis: 'H4',
                  });
                }
              } else {
                skippedCount++;
                logError('Skipping invalid product data', {
                  component: 'ProposalAPI',
                  operation: 'PUT',
                  proposalId: id,
                  product: {
                    id: product.id,
                    name: product.name,
                    productId: productId,
                    quantity: quantity,
                    unitPrice: unitPrice,
                    isValid: false,
                    validationFailures: {
                      noProductId: !productId,
                      invalidQuantity: quantity <= 0,
                      invalidUnitPrice: unitPrice < 0,
                    },
                  },
                  userStory: 'US-3.2',
                  hypothesis: 'H4',
                });
              }
            }

            logInfo('Proposal products updated successfully', {
              component: 'ProposalAPI',
              operation: 'PUT',
              proposalId: id,
              totalProducts: productData.products.length,
              productsCreated: createdCount,
              skippedProducts: productData.products.length - createdCount,
              userStory: 'US-3.2',
              hypothesis: 'H4',
            });

            // ✅ FIXED: Recalculate proposal total value after product updates
            if (createdCount > 0) {
              logInfo('🔍 DEBUG: Starting proposal value recalculation', {
                component: 'ProposalAPI',
                operation: 'PUT',
                proposalId: id,
                createdCount: createdCount,
                skippedProducts: productData.products.length - createdCount,
                userStory: 'US-3.2',
                hypothesis: 'H4',
              });

              const totalValueResult = (await prisma.$queryRaw(
                Prisma.sql`
                  SELECT COALESCE(SUM(total), 0) as totalValue
                  FROM proposal_products
                  WHERE "proposalId" = ${id}
                `
              )) as Array<{ totalvalue: number }>;

              const newTotalValue = Number(totalValueResult[0]?.totalvalue || 0);

              logInfo('🔍 DEBUG: Total value calculation result', {
                component: 'ProposalAPI',
                operation: 'PUT',
                proposalId: id,
                rawResult: totalValueResult,
                totalValueResult: totalValueResult[0]?.totalvalue,
                newTotalValue: newTotalValue,
                newTotalValueType: typeof newTotalValue,
                userStory: 'US-3.2',
                hypothesis: 'H4',
              });

              // Update the proposal's value field
              console.log('🔍 DEBUG: About to update proposal value field', {
                proposalId: id,
                newTotalValue: newTotalValue,
                newTotalValueType: typeof newTotalValue,
              });

              await tx.proposal.update({
                where: { id },
                data: {
                  value: newTotalValue,
                  updatedAt: new Date(),
                },
              });

              logInfo('✅ DEBUG: Proposal total value updated successfully', {
                component: 'ProposalAPI',
                operation: 'PUT',
                proposalId: id,
                oldValue: processedBasicFields.value || 0,
                newValue: newTotalValue,
                valueDifference: newTotalValue - (processedBasicFields.value || 0),
                userStory: 'US-3.2',
                hypothesis: 'H4',
              });

              // Update processedBasicFields to reflect the new value
              processedBasicFields.value = newTotalValue;

              logInfo('🔍 DEBUG: Final processed data', {
                component: 'ProposalAPI',
                operation: 'PUT',
                proposalId: id,
                processedBasicFieldsValue: processedBasicFields.value,
                processedBasicFieldsValueType: typeof processedBasicFields.value,
                userStory: 'US-3.2',
                hypothesis: 'H4',
              });

              // ✅ NEW: Auto-create version snapshot when products are actually updated
              if (createdCount > 0) {
                logInfo('🔍 DEBUG: Auto-creating version snapshot for product changes', {
                  component: 'ProposalAPI',
                  operation: 'PUT',
                  proposalId: id,
                  createdCount: createdCount,
                  hasProductData: !!productData,
                  userStory: 'US-3.2',
                  hypothesis: 'H4',
                });

                // Get current proposal data for version snapshot
                const currentProposal = await tx.proposal.findUnique({
                  where: { id },
                  include: {
                    products: {
                      select: {
                        productId: true,
                        quantity: true,
                        unitPrice: true,
                        total: true,
                        configuration: true,
                      },
                    },
                    sections: {
                      select: {
                        id: true,
                        title: true,
                        content: true,
                        order: true,
                      },
                    },
                  },
                });

                if (currentProposal) {
                  // Get next version number
                  const lastVersion =
                    (
                      await tx.proposalVersion.findFirst({
                        where: { proposalId: id },
                        orderBy: { version: 'desc' },
                        select: { version: true },
                      })
                    )?.version || 0;

                  const nextVersion = lastVersion + 1;

                  // Create comprehensive snapshot
                  const snapshot = {
                    id: currentProposal.id,
                    title: currentProposal.title,
                    status: currentProposal.status,
                    priority: currentProposal.priority,
                    value: newTotalValue, // Use the newly calculated total
                    currency: currentProposal.currency,
                    customerId: currentProposal.customerId,
                    metadata: currentProposal.metadata,
                    products: currentProposal.products,
                    sections: currentProposal.sections,
                    updatedAt: currentProposal.updatedAt,
                    calculatedTotalValue: newTotalValue,
                    originalStoredValue: currentProposal.value,
                    changeSummary: `Product catalog updated: ${createdCount} products modified`,
                    changeType: 'update' as const,
                  };

                  // Create version snapshot
                  await tx.proposalVersion.create({
                    data: {
                      proposalId: id,
                      version: nextVersion,
                      createdBy: currentUserId || 'system',
                      changeType: 'update',
                      changesSummary: `Product catalog updated: ${createdCount} products modified, total value: ${formatCurrency(newTotalValue)}`,
                      snapshot: snapshot as any,
                      productIds: currentProposal.products.map(p => p.productId),
                    },
                  });

                  logInfo('✅ DEBUG: Version snapshot auto-created successfully', {
                    component: 'ProposalAPI',
                    operation: 'PUT',
                    proposalId: id,
                    version: nextVersion,
                    createdProducts: createdCount,
                    totalValue: newTotalValue,
                    userStory: 'US-3.2',
                    hypothesis: 'H4',
                  });
                }
              }
            }
          }

          // 3. ✅ FIXED: Handle section data by updating ProposalSection records
          if (sectionData && sectionData.sections && Array.isArray(sectionData.sections)) {
            logInfo('Processing section data for proposal update', {
              component: 'ProposalAPI',
              operation: 'PUT',
              proposalId: id,
              sectionCount: sectionData.sections.length,
              userStory: 'US-3.2',
              hypothesis: 'H4',
            });

            // Delete existing proposal sections
            await tx.proposalSection.deleteMany({
              where: { proposalId: id },
            });

            // Create new proposal sections
            for (const section of sectionData.sections) {
              if (section.title && section.content) {
                await tx.proposalSection.create({
                  data: {
                    proposalId: id,
                    title: section.title,
                    content: section.content,
                    order: section.order || 1,
                    type: section.type || 'TEXT',
                  },
                });
              }
            }

            logInfo('Proposal sections updated successfully', {
              component: 'ProposalAPI',
              operation: 'PUT',
              proposalId: id,
              sectionsCreated: sectionData.sections.length,
              userStory: 'US-3.2',
              hypothesis: 'H4',
            });
          }

          // 4. Fetch the updated proposal with all relations and verify data integrity
          const finalProposal = await tx.proposal.findUnique({
            where: { id },
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              sections: {
                orderBy: { order: 'asc' },
              },
              products: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      sku: true,
                      category: true,
                    },
                  },
                },
              },
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          });

          // ✅ ADDED: Verification logic to ensure data integrity
          if (finalProposal && productData?.products) {
            const savedProductCount = finalProposal.products.length;
            const expectedProductCount = productData.products.filter(
              (p: any) => p.productId && p.quantity > 0
            ).length;
            const savedTotal = finalProposal.products.reduce(
              (sum, p) => sum + Number(p.total || 0),
              0
            );
            const expectedTotal = productData.totalValue || 0;

            logInfo('Data verification after proposal update', {
              component: 'ProposalAPI',
              operation: 'PUT',
              proposalId: id,
              verification: {
                products: {
                  expected: expectedProductCount,
                  saved: savedProductCount,
                  match: savedProductCount === expectedProductCount,
                },
                total: {
                  expected: expectedTotal,
                  saved: savedTotal,
                  match: Math.abs(savedTotal - expectedTotal) < 0.01,
                },
              },
              userStory: 'US-3.2',
              hypothesis: 'H4',
            });

            // Log verification mismatch if any
            if (
              savedProductCount !== expectedProductCount ||
              Math.abs(savedTotal - expectedTotal) >= 0.01
            ) {
              logError('Verification mismatch detected', {
                component: 'ProposalAPI',
                operation: 'PUT',
                proposalId: id,
                mismatch: {
                  productCount: savedProductCount !== expectedProductCount,
                  total: Math.abs(savedTotal - expectedTotal) >= 0.01,
                },
                details: {
                  expectedProducts: expectedProductCount,
                  savedProducts: savedProductCount,
                  expectedTotal: expectedTotal,
                  savedTotal: savedTotal,
                },
                userStory: 'US-3.2',
                hypothesis: 'H4',
              });
            }
          }

          return finalProposal;
        },
        {
          timeout: 15000, // 15 second timeout to prevent network connection loss
          isolationLevel: 'ReadCommitted',
        }
      );

      const transactionDuration = Date.now() - transactionStartTime;
      logInfo('Proposal update transaction completed', {
        component: 'ProposalAPI',
        operation: 'PUT',
        proposalId: id,
        transactionDuration,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      // Transform null values to appropriate defaults before validation
      const transformedProposal = {
        ...proposal,
        description: proposal?.description || '',
        metadata: proposal?.metadata || {},
        customer: proposal?.customer
          ? {
              ...proposal.customer,
              email: proposal.customer.email || '',
              industry: (proposal.customer as any).industry || '',
            }
          : undefined,
        title: proposal?.title || 'Untitled Proposal', // Handle empty titles
        // ✅ FIXED: Handle null product relations and missing product names
        products: proposal?.products
          ? proposal.products
              .filter(pp => pp.product) // Remove orphaned ProposalProduct records
              .map(pp => ({
                ...pp,
                name: pp.product?.name || `Product ${pp.productId}`, // Handle null product names
                category: pp.product?.category?.[0] || 'General', // Handle null category
              }))
          : [],
      };

      logInfo('Proposal updated successfully', {
        component: 'ProposalAPI',
        operation: 'PUT',
        proposalId: id,
        userId: user.id,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      // Validate response against schema
      const validationResult = ProposalSchema.safeParse(transformedProposal);
      if (!validationResult.success) {
        logError('Proposal schema validation failed after update', validationResult.error, {
          component: 'ProposalAPI',
          operation: 'PUT',
          proposalId: id,
        });
        // Return the transformed proposal data anyway for now, but log the validation error
        const responsePayload = { ok: true, data: transformedProposal };
        return new Response(JSON.stringify(responsePayload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const responsePayload = { ok: true, data: validationResult.data };
      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      // Handle specific network and timeout errors
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('Load failed')) {
          logError('Network timeout during proposal update', {
            component: 'ProposalAPI',
            operation: 'PUT',
            proposalId: id,
            error: error.message,
            userStory: 'US-3.2',
            hypothesis: 'H4',
          });
          return new Response(
            JSON.stringify({
              ok: false,
              code: 'NETWORK_TIMEOUT',
              message:
                'Request timed out. Please try again with a smaller update or check your connection.',
              details: { proposalId: id },
            }),
            {
              status: 408, // Request Timeout
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        if (error.message.includes('connection') || error.message.includes('network')) {
          logError('Network connection error during proposal update', {
            component: 'ProposalAPI',
            operation: 'PUT',
            proposalId: id,
            error: error.message,
            userStory: 'US-3.2',
            hypothesis: 'H4',
          });
          return new Response(
            JSON.stringify({
              ok: false,
              code: 'NETWORK_ERROR',
              message:
                'Network connection lost. Please check your internet connection and try again.',
              details: { proposalId: id },
            }),
            {
              status: 503, // Service Unavailable
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      }

      const processedError = errorHandlingService.processError(
        error,
        'Failed to update proposal',
        undefined,
        {
          component: 'ProposalAPI',
          operation: 'PUT',
          proposalId: id,
          userId: user.id,
          userStory: 'US-3.2',
          hypothesis: 'H4',
        }
      );
      throw processedError; // createRoute handles errorToJson automatically
    }
  }
);

// ====================
// DELETE /api/proposals/[id] - Delete proposal
// ====================

export const DELETE = createRoute(
  {
    roles: ['admin', 'System Administrator', 'Administrator'],
  },
  async ({ req, user }) => {
    const id = req.url.split('/').pop()?.split('?')[0];

    if (!id) {
      return Response.json(fail('VALIDATION_ERROR', 'Proposal ID is required'), { status: 400 });
    }
    try {
      logInfo('Deleting proposal', {
        component: 'ProposalAPI',
        operation: 'DELETE',
        proposalId: id,
        userId: user.id,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      await prisma.proposal.delete({
        where: { id },
      });

      logInfo('Proposal deleted successfully', {
        component: 'ProposalAPI',
        operation: 'DELETE',
        proposalId: id,
        userId: user.id,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      const responsePayload = { ok: true, data: { success: true } };
      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      const processedError = errorHandlingService.processError(
        error,
        'Failed to delete proposal',
        undefined,
        {
          component: 'ProposalAPI',
          operation: 'DELETE',
          proposalId: id,
          userId: user.id,
          userStory: 'US-3.2',
          hypothesis: 'H4',
        }
      );
      throw processedError; // createRoute handles errorToJson automatically
    }
  }
);
